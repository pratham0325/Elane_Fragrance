import { FilterQuery } from 'mongoose';
import { z } from 'zod';
import { Product, IProduct } from '../../models/Product.model';
import { AiUsage } from '../../models/AiUsage.model';
import { getAIProvider, parseJsonResponse } from './AIProvider';
import { fragranceRecommendationPrompt } from './prompts';
import { extractIntent, SearchIntent } from './FragranceIntentService';
import { embedQuery } from './EmbeddingService';
import { rankProducts, RankedProduct } from './rankingEngine';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

const CANDIDATE_POOL = 60; // retrieved from Mongo before ranking
const TOP_K = 6;           // returned to the user / sent to the LLM

export interface SearchResultItem {
  productId: string;
  matchScore: number;
  reason: string;
  matchedOn: string[];
  product: IProduct;
}

export interface FragranceSearchResponse {
  intent: SearchIntent;
  results: SearchResultItem[];
  explanation: string;
  usedFallback: boolean;
  aiAvailable: boolean;
  notice?: string;
}

// ── Simple in-memory TTL cache for repeated queries ─────────────────────────
const cache = new Map<string, { data: FragranceSearchResponse; expires: number }>();

function cacheGet(key: string): FragranceSearchResponse | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key: string, data: FragranceSearchResponse) {
  if (cache.size > 200) cache.clear(); // crude bound; fine for this scale
  cache.set(key, { data, expires: Date.now() + env.AI_CACHE_TTL_MS });
}

/**
 * Builds Mongo hard filters. Deliberately permissive — budget is applied as a
 * generous ceiling so the ranker can still surface slightly-over items rather
 * than returning an empty page.
 */
function buildHardFilter(intent: SearchIntent): FilterQuery<IProduct> {
  const filter: FilterQuery<IProduct> = { isActive: true };

  if (intent.budget.max !== null) {
    filter.price = { $lte: Math.round(intent.budget.max * 100 * 1.35) };
  }
  if (intent.budget.min !== null) {
    filter.price = { ...(filter.price as object), $gte: Math.round(intent.budget.min * 100 * 0.8) };
  }
  if (intent.gender) {
    filter.gender = { $in: [intent.gender, 'Unisex'] };
  }
  return filter;
}

const aiExplanationSchema = z.object({
  explanation: z.string().default(''),
  results: z.array(z.object({ productId: z.string(), reason: z.string() })).default([])
});

/** Deterministic reason string used when the LLM is unavailable. */
function buildDeterministicReason(ranked: RankedProduct): string {
  const p = ranked.product;
  const bits: string[] = [];

  if (ranked.matchedOn.length) bits.push(`Matches ${ranked.matchedOn.slice(0, 3).join(', ')}`);
  bits.push(`${p.fragranceFamily.toLowerCase()} profile`);

  const sp = p.scentProfile;
  if (sp.projection >= 70) bits.push('strong projection');
  else if (sp.projection <= 35) bits.push('subtle projection');
  if (sp.longevity >= 80) bits.push('long-lasting wear');

  return `${bits.join(', ')}.`;
}

async function generateAIExplanations(
  intent: SearchIntent,
  ranked: RankedProduct[]
): Promise<{ explanation: string; reasons: Map<string, string>; tokens?: any } | null> {
  const provider = getAIProvider();
  if (!provider || !ranked.length) return null;

  // Only the minimum necessary product data goes to the LLM — never the DB.
  const candidates = ranked.map((r) => ({
    productId: r.product._id.toString(),
    name: r.product.name,
    price: `₹${Math.round(r.product.price / 100)}`,
    fragranceFamily: r.product.fragranceFamily,
    concentration: r.product.concentration,
    gender: r.product.gender,
    topNotes: r.product.topNotes,
    heartNotes: r.product.middleNotes,
    baseNotes: r.product.baseNotes,
    scentProfile: r.product.scentProfile,
    rating: r.product.averageRating,
    matchedOn: r.matchedOn
  }));

  try {
    const userBlock = `SHOPPER INTENT:\n${JSON.stringify(intent, null, 2)}\n\nCANDIDATE CATALOG:\n${JSON.stringify(candidates, null, 2)}`;
    const res = await provider.chat(fragranceRecommendationPrompt, userBlock, 900);
    const parsed = aiExplanationSchema.safeParse(parseJsonResponse(res.text));
    if (!parsed.success) return null;

    // CRITICAL: discard any productId the AI invented.
    const validIds = new Set(candidates.map((c) => c.productId));
    const reasons = new Map<string, string>();
    for (const r of parsed.data.results) {
      if (validIds.has(r.productId) && r.reason?.trim()) {
        reasons.set(r.productId, r.reason.trim());
      }
    }

    return {
      explanation: parsed.data.explanation,
      reasons,
      tokens: { prompt: res.promptTokens, completion: res.completionTokens, total: res.totalTokens }
    };
  } catch (err) {
    logger.warn({ err }, 'AI explanation generation failed — using deterministic reasons');
    return null;
  }
}

export async function fragranceSearch(
  query: string,
  userId?: string
): Promise<FragranceSearchResponse> {
  const cacheKey = query.trim().toLowerCase();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const started = Date.now();
  const provider = getAIProvider();
  let usedFallback = false;
  let notice: string | undefined;
  let tokens: any;

  // ── 1. Intent ─────────────────────────────────────────────────────────────
  const intentResult = await extractIntent(query);
  const intent = intentResult.intent;
  if (intentResult.usedFallback) {
    usedFallback = true;
    if (provider) {
      notice = "Scent Intelligence is temporarily unavailable. We've switched to our standard fragrance search.";
    }
  }
  tokens = intentResult.tokens;

  // ── 2. Retrieve candidates (hard filters) ────────────────────────────────
  let candidates = await Product.find(buildHardFilter(intent))
    .select('+aiEmbedding')
    .limit(CANDIDATE_POOL);

  // If filters were too tight, retry unfiltered so we never show an empty page
  if (candidates.length < 3) {
    candidates = await Product.find({ isActive: true }).select('+aiEmbedding').limit(CANDIDATE_POOL);
  }

  // ── 3. Semantic vector (optional) ─────────────────────────────────────────
  const queryVector = await embedQuery(intent.semanticQuery || query);

  // ── 4. Deterministic hybrid ranking ──────────────────────────────────────
  const ranked = rankProducts(candidates, intent, queryVector, TOP_K);

  // ── 5. AI explanations (optional layer on top of deterministic ranking) ──
  const aiExplain = await generateAIExplanations(intent, ranked);
  if (!aiExplain && provider && !usedFallback) {
    usedFallback = true;
    notice = "Scent Intelligence is temporarily unavailable. We've switched to our standard fragrance search.";
  }

  const results: SearchResultItem[] = ranked.map((r) => ({
    productId: r.product._id.toString(),
    matchScore: Math.round(r.score * 100) / 100,
    reason: aiExplain?.reasons.get(r.product._id.toString()) ?? buildDeterministicReason(r),
    matchedOn: r.matchedOn,
    product: r.product
  }));

  const explanation =
    aiExplain?.explanation ||
    (results.length
      ? `We found ${results.length} fragrances matching your request${intent.budget.max ? ` within ₹${intent.budget.max}` : ''}.`
      : "We couldn't find an exact match.");

  const response: FragranceSearchResponse = {
    intent,
    results,
    explanation,
    usedFallback,
    aiAvailable: Boolean(provider),
    notice
  };

  // ── 6. Usage tracking ─────────────────────────────────────────────────────
  await AiUsage.create({
    user: userId,
    feature: 'fragrance_search',
    model: provider?.chatModel ?? 'rule-based',
    promptTokens: tokens?.prompt,
    completionTokens: tokens?.completion,
    totalTokens: tokens?.total,
    latencyMs: Date.now() - started,
    success: true,
    usedFallback
  }).catch((err) => logger.warn({ err }, 'AI usage tracking failed'));

  cacheSet(cacheKey, response);
  return response;
}
