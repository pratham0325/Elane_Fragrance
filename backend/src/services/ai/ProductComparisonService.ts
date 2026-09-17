import { z } from 'zod';
import { Product, IProduct, ProductDocument } from '../../models/Product.model';
import { AiUsage } from '../../models/AiUsage.model';
import { getAIProvider, parseJsonResponse } from './AIProvider';
import { productComparisonPrompt } from './prompts';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';
import { deriveOccasions, deriveSeasons } from './EmbeddingService';

export interface ComparisonResponse {
  recommendation: { productId: string; productName: string; reason: string };
  comparison: {
    productId: string;
    productName: string;
    strengths: string[];
    weaknesses: string[];
    bestFor: string[];
  }[];
  attributes: { label: string; values: { productId: string; value: string }[] }[];
  products: ProductDocument[];
  usedFallback: boolean;
  notice?: string;
}

const comparisonSchema = z.object({
  recommendation: z.object({
    productId: z.string(),
    productName: z.string(),
    reason: z.string()
  }),
  comparison: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      strengths: z.array(z.string()).default([]),
      weaknesses: z.array(z.string()).default([]),
      bestFor: z.array(z.string()).default([])
    })
  ),
  attributes: z
    .array(
      z.object({
        label: z.string(),
        values: z.array(z.object({ productId: z.string(), value: z.string() }))
      })
    )
    .default([])
});

// ── Deterministic helpers (used for fallback and for validating AI output) ──

function qualitative(value: number, scale: 'quality' | 'level' | 'duration'): string {
  if (scale === 'quality') {
    if (value >= 75) return 'Excellent';
    if (value >= 55) return 'Good';
    if (value >= 35) return 'Moderate';
    return 'Limited';
  }
  if (scale === 'duration') {
    if (value >= 85) return 'Very Long';
    if (value >= 65) return 'Long';
    if (value >= 45) return 'Medium';
    return 'Short';
  }
  if (value >= 70) return 'High';
  if (value >= 40) return 'Moderate';
  return 'Low';
}

function buildAttributeTable(products: ProductDocument[]): ComparisonResponse['attributes'] {
  const rows: { label: string; get: (p: ProductDocument) => string }[] = [
    { label: 'Price', get: (p) => `₹${Math.round(p.price / 100).toLocaleString('en-IN')}` },
    { label: 'Family', get: (p) => p.fragranceFamily },
    {
      label: 'Daily Wear',
      get: (p) => qualitative(100 - Math.abs(p.scentProfile.projection - 50) * 1.4, 'quality')
    },
    {
      label: 'Date Night',
      get: (p) =>
        qualitative((p.scentProfile.projection + p.scentProfile.longevity) / 2, 'quality')
    },
    {
      label: 'Office',
      get: (p) =>
        qualitative(p.scentProfile.projection <= 65 ? 80 : 45, 'quality')
    },
    { label: 'Projection', get: (p) => qualitative(p.scentProfile.projection, 'level') },
    { label: 'Longevity', get: (p) => qualitative(p.scentProfile.longevity, 'duration') },
    { label: 'Sweetness', get: (p) => qualitative(p.scentProfile.sweetness, 'level') },
    { label: 'Freshness', get: (p) => qualitative(p.scentProfile.freshness, 'level') },
    {
      label: 'Summer',
      get: (p) => qualitative(p.scentProfile.freshness, 'quality')
    },
    {
      label: 'Winter',
      get: (p) => qualitative((p.scentProfile.woody + p.scentProfile.spicy) / 2, 'quality')
    }
  ];

  return rows.map((row) => ({
    label: row.label,
    values: products.map((p) => ({ productId: p._id.toString(), value: row.get(p) }))
  }));
}

function buildDeterministicComparison(products: ProductDocument[], userNeeds?: string): ComparisonResponse {
  const scored = products.map((p) => {
    const sp = p.scentProfile;
    // Versatility: balanced projection + solid longevity + rating
    const versatility =
      (100 - Math.abs(sp.projection - 55)) * 0.4 + sp.longevity * 0.3 + p.averageRating * 20 * 0.3;
    return { product: p, versatility };
  });

  const best = scored.reduce((a, b) => (b.versatility > a.versatility ? b : a));

  const comparison = products.map((p) => {
    const sp = p.scentProfile;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const bestFor: string[] = [];

    if (sp.longevity >= 75) strengths.push('Long-lasting wear');
    if (sp.projection >= 70) strengths.push('Strong projection');
    if (sp.projection <= 45) strengths.push('Subtle, skin-close presence');
    if (sp.freshness >= 70) strengths.push('Crisp and fresh');
    if (p.averageRating >= 4.5) strengths.push(`Highly rated (${p.averageRating.toFixed(1)})`);

    if (sp.projection >= 80) weaknesses.push('May be overpowering in close quarters');
    if (sp.longevity <= 55) weaknesses.push('Requires reapplication through the day');
    if (sp.sweetness >= 70) weaknesses.push('Sweetness may not suit formal settings');
    if (p.price >= 20000) weaknesses.push('Higher price point');
    if (!weaknesses.length) weaknesses.push('No significant trade-offs for general wear');

    bestFor.push(...deriveOccasions(p).slice(0, 3));
    bestFor.push(...deriveSeasons(p).slice(0, 2));

    return {
      productId: p._id.toString(),
      productName: p.name,
      strengths: strengths.length ? strengths : ['Balanced everyday profile'],
      weaknesses,
      bestFor: Array.from(new Set(bestFor))
    };
  });

  return {
    recommendation: {
      productId: best.product._id.toString(),
      productName: best.product.name,
      reason: `${best.product.name} offers the best balance of projection, longevity and versatility across the fragrances you selected${userNeeds ? ', based on the needs you described' : ''}.`
    },
    comparison,
    attributes: buildAttributeTable(products),
    products,
    usedFallback: true
  };
}

export async function compareProducts(
  productIds: string[],
  userNeeds: string | undefined,
  userId?: string
): Promise<ComparisonResponse> {
  const started = Date.now();

  // ── Load real products; reject anything not in the DB ────────────────────
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  if (products.length < 2) {
    throw ApiError.badRequest('Select at least 2 available fragrances to compare');
  }

  // Preserve the order the user selected
  const ordered: ProductDocument[] = productIds.flatMap((id) => {
    const match = products.find((p) => p._id.toString() === id);
    return match ? [match] : [];
  });

  const provider = getAIProvider();
  if (!provider) {
    const fallback = buildDeterministicComparison(ordered, userNeeds);
    fallback.notice = 'Scent Intelligence is temporarily unavailable. Showing our standard comparison.';
    return fallback;
  }

  // Only the selected products' real data is sent — never the whole catalog.
  const payload = ordered.map((p) => ({
    productId: p._id.toString(),
    name: p.name,
    price: `₹${Math.round(p.price / 100)}`,
    fragranceFamily: p.fragranceFamily,
    concentration: p.concentration,
    gender: p.gender,
    topNotes: p.topNotes,
    heartNotes: p.middleNotes,
    baseNotes: p.baseNotes,
    scentProfile: p.scentProfile,
    rating: p.averageRating,
    reviewCount: p.reviewCount,
    occasions: deriveOccasions(p),
    seasons: deriveSeasons(p)
  }));

  try {
    const userBlock = [
      userNeeds ? `SHOPPER NEEDS:\n<shopper_needs>\n${userNeeds}\n</shopper_needs>` : 'SHOPPER NEEDS: not specified.',
      `\nPRODUCTS:\n${JSON.stringify(payload, null, 2)}`
    ].join('\n');

    const res = await provider.chat(productComparisonPrompt, userBlock, 1500);
    const parsed = comparisonSchema.safeParse(parseJsonResponse(res.text));

    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'AI comparison failed validation — using deterministic comparison');
      const fallback = buildDeterministicComparison(ordered, userNeeds);
      return fallback;
    }

    // CRITICAL: validate every productId against the real set.
    const validIds = new Set(ordered.map((p) => p._id.toString()));
    const data = parsed.data;

    if (!validIds.has(data.recommendation.productId)) {
      logger.warn('AI recommended a productId outside the supplied set — using deterministic comparison');
      return buildDeterministicComparison(ordered, userNeeds);
    }

    const cleanComparison = data.comparison.filter((c) => validIds.has(c.productId));
    if (cleanComparison.length !== ordered.length) {
      return buildDeterministicComparison(ordered, userNeeds);
    }

    const cleanAttributes = data.attributes
      .map((a) => ({ label: a.label, values: a.values.filter((v) => validIds.has(v.productId)) }))
      .filter((a) => a.values.length === ordered.length);

    await AiUsage.create({
      user: userId,
      feature: 'product_comparison',
      model: provider.chatModel,
      promptTokens: res.promptTokens,
      completionTokens: res.completionTokens,
      totalTokens: res.totalTokens,
      latencyMs: Date.now() - started,
      success: true,
      usedFallback: false
    }).catch(() => {});

    return {
      recommendation: data.recommendation,
      comparison: cleanComparison,
      // Fall back to the deterministic table if the AI's table was unusable
      attributes: cleanAttributes.length ? cleanAttributes : buildAttributeTable(ordered),
      products: ordered,
      usedFallback: false
    };
  } catch (err) {
    logger.warn({ err }, 'AI comparison failed — using deterministic comparison');

    await AiUsage.create({
      user: userId,
      feature: 'product_comparison',
      model: provider.chatModel,
      latencyMs: Date.now() - started,
      success: false,
      usedFallback: true,
      errorMessage: err instanceof Error ? err.message.slice(0, 300) : 'Unknown'
    }).catch(() => {});

    const fallback = buildDeterministicComparison(ordered, userNeeds);
    fallback.notice = 'Scent Intelligence is temporarily unavailable. Showing our standard comparison.';
    return fallback;
  }
}
