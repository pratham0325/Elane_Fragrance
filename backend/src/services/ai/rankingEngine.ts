import { IProduct } from '../../models/Product.model';
import { SearchIntent } from './FragranceIntentService';
import { cosineSimilarity, deriveOccasions, deriveSeasons } from './EmbeddingService';

/** Configurable, sums to 1.0. Tune without touching scoring logic. */
export const RANKING_WEIGHTS = {
  semantic: 0.45,
  preference: 0.25,
  occasionSeason: 0.15,
  price: 0.10,
  popularity: 0.05
} as const;

export interface ScoreBreakdown {
  semantic: number;
  preference: number;
  occasionSeason: number;
  price: number;
  popularity: number;
}

export interface RankedProduct {
  product: IProduct;
  score: number;
  breakdown: ScoreBreakdown;
  matchedOn: string[];
}

const LEVEL_TARGET: Record<string, number> = {
  low: 25, medium: 55, high: 85,
  light: 25, moderate: 55, strong: 85,
  short: 25, long: 85
};

/** Converts a 0-100 attribute vs. a desired level into a 0-1 closeness score. */
function levelScore(actual: number, level: string | null): number | null {
  if (!level) return null;
  const target = LEVEL_TARGET[level];
  if (target === undefined) return null;
  return 1 - Math.min(Math.abs(actual - target) / 100, 1);
}

/**
 * Lexical similarity used when embeddings are unavailable. Token overlap
 * between the query and the product's searchable text.
 */
export function lexicalSimilarity(query: string, product: IProduct): number {
  const stop = new Set(['the', 'a', 'an', 'for', 'and', 'or', 'with', 'i', 'want', 'need',
    'something', 'me', 'my', 'is', 'it', 'to', 'in', 'of', 'that', 'this', 'not', 'too', 'under']);

  const tokens = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2 && !stop.has(t));
  if (!tokens.length) return 0;

  const haystack = [
    product.name, product.fragranceFamily, product.concentration, product.gender,
    product.shortDescription, product.description,
    ...product.topNotes, ...product.middleNotes, ...product.baseNotes, ...product.tags
  ].join(' ').toLowerCase();

  const hits = tokens.filter((t) => haystack.includes(t)).length;
  return hits / tokens.length;
}

export function scoreProduct(
  product: IProduct,
  intent: SearchIntent,
  queryVector: number[] | null
): RankedProduct {
  const sp = product.scentProfile;
  const matchedOn: string[] = [];

  // ── 1. Semantic similarity ────────────────────────────────────────────────
  let semantic: number;
  if (queryVector && product.aiEmbedding?.length) {
    // cosine is -1..1; normalise to 0..1
    semantic = (cosineSimilarity(queryVector, product.aiEmbedding) + 1) / 2;
  } else {
    semantic = lexicalSimilarity(intent.semanticQuery, product);
  }

  // ── 2. Preference match (scent profile + family + gender + notes) ─────────
  const prefScores: number[] = [];

  const sweet = levelScore(sp.sweetness, intent.sweetness);
  if (sweet !== null) { prefScores.push(sweet); if (sweet > 0.7) matchedOn.push(`${intent.sweetness} sweetness`); }

  const fresh = levelScore(sp.freshness, intent.freshness);
  if (fresh !== null) { prefScores.push(fresh); if (fresh > 0.7) matchedOn.push(`${intent.freshness} freshness`); }

  const proj = levelScore(sp.projection, intent.projection ?? intent.intensity);
  if (proj !== null) { prefScores.push(proj); if (proj > 0.7) matchedOn.push('projection'); }

  const longev = levelScore(sp.longevity, intent.longevity);
  if (longev !== null) { prefScores.push(longev); if (longev > 0.7) matchedOn.push('longevity'); }

  if (intent.fragranceFamilies.length) {
    const hit = intent.fragranceFamilies.includes(product.fragranceFamily as never);
    prefScores.push(hit ? 1 : 0);
    if (hit) matchedOn.push(product.fragranceFamily);
  }

  if (intent.gender) {
    // Unisex satisfies any gender request partially
    const hit = product.gender === intent.gender ? 1 : product.gender === 'Unisex' ? 0.7 : 0.15;
    prefScores.push(hit);
    if (hit === 1) matchedOn.push(intent.gender);
  }

  if (intent.notes.length) {
    const all = [...product.topNotes, ...product.middleNotes, ...product.baseNotes]
      .map((n) => n.toLowerCase());
    const hits = intent.notes.filter((n) => all.some((a) => a.includes(n.toLowerCase())));
    prefScores.push(hits.length / intent.notes.length);
    if (hits.length) matchedOn.push(...hits);
  }

  // "avoid" acts as a penalty, not a filter
  let avoidPenalty = 0;
  if (intent.avoid.some((a) => /sweet/i.test(a)) && sp.sweetness >= 65) avoidPenalty += 0.3;
  if (intent.avoid.some((a) => /strong|powerful/i.test(a)) && sp.projection >= 75) avoidPenalty += 0.25;

  const preference = prefScores.length
    ? Math.max(0, prefScores.reduce((a, b) => a + b, 0) / prefScores.length - avoidPenalty)
    : 0.5; // neutral when no preferences expressed

  // ── 3. Occasion / season ──────────────────────────────────────────────────
  const productOccasions = deriveOccasions(product).map((o) => o.toLowerCase());
  const productSeasons = deriveSeasons(product).map((s) => s.toLowerCase());
  const osScores: number[] = [];

  if (intent.occasion.length) {
    const hits = intent.occasion.filter((o) =>
      productOccasions.some((po) => po.includes(o.toLowerCase()) || o.toLowerCase().includes(po))
    );
    osScores.push(hits.length / intent.occasion.length);
    if (hits.length) matchedOn.push(...hits);
  }
  if (intent.season.length) {
    const hits = intent.season.filter((s) =>
      productSeasons.some((ps) => ps.includes(s.toLowerCase()) || ps === 'all-season')
    );
    osScores.push(hits.length / intent.season.length);
    if (hits.length) matchedOn.push(...hits);
  }
  const occasionSeason = osScores.length ? osScores.reduce((a, b) => a + b, 0) / osScores.length : 0.5;

  // ── 4. Price fit (prices stored in paise; intent budget in rupees) ────────
  let price = 0.5;
  const rupees = product.price / 100;
  const { min, max } = intent.budget;
  if (max !== null) {
    if (rupees <= max) {
      // Reward using the budget well rather than being merely cheap
      price = 0.75 + 0.25 * (rupees / max);
      matchedOn.push(`under ₹${max}`);
    } else {
      // Soft decay past budget rather than hard exclusion
      price = Math.max(0, 1 - (rupees - max) / max);
    }
  }
  if (min !== null && rupees < min) price *= 0.5;

  // ── 5. Popularity ─────────────────────────────────────────────────────────
  const ratingScore = product.averageRating / 5;
  const reviewBoost = Math.min(product.reviewCount / 100, 1);
  const popularity = ratingScore * 0.7 + reviewBoost * 0.3;

  // ── Final ─────────────────────────────────────────────────────────────────
  const breakdown: ScoreBreakdown = { semantic, preference, occasionSeason, price, popularity };
  const score =
    semantic * RANKING_WEIGHTS.semantic +
    preference * RANKING_WEIGHTS.preference +
    occasionSeason * RANKING_WEIGHTS.occasionSeason +
    price * RANKING_WEIGHTS.price +
    popularity * RANKING_WEIGHTS.popularity;

  // Out-of-stock products sink but remain visible
  const inStock = product.sizes.some((s) => s.stock > 0);
  const finalScore = inStock ? score : score * 0.4;

  return {
    product,
    score: Math.max(0, Math.min(1, finalScore)),
    breakdown,
    matchedOn: Array.from(new Set(matchedOn)).slice(0, 5)
  };
}

export function rankProducts(
  products: IProduct[],
  intent: SearchIntent,
  queryVector: number[] | null,
  limit = 8
): RankedProduct[] {
  return products
    .map((p) => scoreProduct(p, intent, queryVector))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
