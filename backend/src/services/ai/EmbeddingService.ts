import { Product, IProduct } from '../../models/Product.model';
import { AiUsage } from '../../models/AiUsage.model';
import { getAIProvider } from './AIProvider';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

/** Maps a 0-100 scent-profile number to a descriptive phrase for embedding text. */
function describe(value: number, low: string, mid: string, high: string): string {
  if (value >= 70) return high;
  if (value >= 40) return mid;
  return low;
}

/**
 * Derives occasions/seasons from the scent profile when a product hasn't had
 * them set explicitly. Keeps the embedding text rich without requiring manual
 * data entry for every product.
 */
export function deriveOccasions(p: IProduct): string[] {
  if (p.occasions?.length) return p.occasions;
  const sp = p.scentProfile;
  const out: string[] = [];
  if (sp.freshness >= 60 && sp.projection <= 70) out.push('office', 'daily', 'college');
  if (sp.projection >= 70 || sp.longevity >= 80) out.push('evening', 'date night', 'party');
  if (sp.woody >= 60 || sp.spicy >= 60) out.push('formal');
  if (sp.sweetness >= 65) out.push('casual');
  return out.length ? Array.from(new Set(out)) : ['daily'];
}

export function deriveSeasons(p: IProduct): string[] {
  if (p.seasons?.length) return p.seasons;
  const sp = p.scentProfile;
  const out: string[] = [];
  if (sp.freshness >= 65) out.push('summer', 'spring');
  if (sp.woody >= 60 || sp.spicy >= 60 || sp.sweetness >= 65) out.push('winter', 'autumn');
  return out.length ? Array.from(new Set(out)) : ['all-season'];
}

/**
 * Builds the canonical text representation of a fragrance that gets embedded.
 * Deliberately verbose — richer text yields better semantic retrieval.
 */
export function buildSemanticText(p: IProduct): string {
  const sp = p.scentProfile;
  const occasions = deriveOccasions(p);
  const seasons = deriveSeasons(p);

  const parts = [
    `${p.name} by ${p.brand}.`,
    `${p.fragranceFamily} ${p.concentration} fragrance for ${p.gender}.`,
    p.shortDescription,
    p.topNotes.length ? `Top notes: ${p.topNotes.join(', ')}.` : '',
    p.middleNotes.length ? `Heart notes: ${p.middleNotes.join(', ')}.` : '',
    p.baseNotes.length ? `Base notes: ${p.baseNotes.join(', ')}.` : '',
    `Freshness is ${describe(sp.freshness, 'low', 'moderate', 'high')}.`,
    `Sweetness is ${describe(sp.sweetness, 'low and dry', 'moderate', 'high and sweet')}.`,
    `Woodiness is ${describe(sp.woody, 'minimal', 'moderate', 'pronounced')}.`,
    `Spiciness is ${describe(sp.spicy, 'minimal', 'moderate', 'pronounced')}.`,
    `Projection is ${describe(sp.projection, 'intimate and subtle', 'moderate', 'strong and powerful')}.`,
    `Longevity is ${describe(sp.longevity, 'short', 'medium', 'very long lasting')}.`,
    `Suitable for ${occasions.join(', ')}.`,
    `Best in ${seasons.join(', ')}.`,
    p.tags.length ? `Character: ${p.tags.join(', ')}.` : '',
    `Priced at ${Math.round(p.price / 100)} rupees.`
  ];

  return parts.filter(Boolean).join(' ');
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export interface IndexResult {
  indexed: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Generates embeddings for products. By default only processes products whose
 * semanticText changed or which have no embedding — avoids burning API credits.
 */
export async function reindexProducts(options: { force?: boolean; productId?: string } = {}): Promise<IndexResult> {
  const provider = getAIProvider();
  const result: IndexResult = { indexed: 0, skipped: 0, failed: 0, errors: [] };

  if (!provider || !provider.supportsEmbeddings()) {
    result.errors.push('No embedding-capable AI provider configured. Semantic search will use lexical fallback.');
    return result;
  }

  const filter: Record<string, unknown> = { isActive: true };
  if (options.productId) filter._id = options.productId;

  const products = await Product.find(filter).select('+aiEmbedding +semanticText');
  const BATCH = 20;

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const pending: { product: IProduct; text: string }[] = [];

    for (const product of batch) {
      const text = buildSemanticText(product);
      const upToDate =
        !options.force &&
        product.semanticText === text &&
        product.aiEmbedding?.length &&
        product.aiEmbeddingModel === provider.embeddingModel;

      if (upToDate) {
        result.skipped++;
        continue;
      }
      pending.push({ product, text });
    }

    if (!pending.length) continue;

    const started = Date.now();
    try {
      const vectors = await provider.embed(pending.map((p) => p.text));

      await Promise.all(
        pending.map(async ({ product, text }, idx) => {
          const vector = vectors[idx];
          if (!vector?.length) {
            result.failed++;
            return;
          }
          await Product.updateOne(
            { _id: product._id },
            {
              $set: {
                aiEmbedding: vector,
                aiEmbeddingModel: provider.embeddingModel,
                aiEmbeddingUpdatedAt: new Date(),
                semanticText: text
              }
            }
          );
          result.indexed++;
        })
      );

      await AiUsage.create({
        feature: 'embedding',
        model: provider.embeddingModel,
        latencyMs: Date.now() - started,
        success: true,
        usedFallback: false
      });
    } catch (err) {
      result.failed += pending.length;
      const msg = err instanceof Error ? err.message : 'Unknown embedding error';
      result.errors.push(msg);
      logger.error({ err }, 'Embedding batch failed');

      await AiUsage.create({
        feature: 'embedding',
        model: provider.embeddingModel,
        latencyMs: Date.now() - started,
        success: false,
        usedFallback: false,
        errorMessage: msg.slice(0, 300)
      });
    }
  }

  return result;
}

/** Embeds a single free-text query for semantic comparison. */
export async function embedQuery(text: string): Promise<number[] | null> {
  const provider = getAIProvider();
  if (!provider || !provider.supportsEmbeddings()) return null;
  try {
    const [vector] = await provider.embed([text.slice(0, env.AI_MAX_QUERY_LENGTH)]);
    return vector ?? null;
  } catch (err) {
    logger.warn({ err }, 'Query embedding failed — falling back to lexical scoring');
    return null;
  }
}

export async function getIndexStatus() {
  const provider = getAIProvider();
  const [total, indexed, lastIndexed] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, aiEmbeddingUpdatedAt: { $ne: null } }),
    Product.findOne({ aiEmbeddingUpdatedAt: { $ne: null } })
      .sort({ aiEmbeddingUpdatedAt: -1 })
      .select('aiEmbeddingUpdatedAt')
  ]);

  return {
    providerConfigured: Boolean(provider),
    providerName: provider?.name ?? null,
    embeddingModel: provider?.embeddingModel ?? null,
    embeddingsSupported: provider?.supportsEmbeddings() ?? false,
    vectorSearchEnabled: env.AI_VECTOR_SEARCH,
    totalProducts: total,
    indexedProducts: indexed,
    pendingProducts: total - indexed,
    lastIndexedAt: lastIndexed?.aiEmbeddingUpdatedAt ?? null
  };
}
