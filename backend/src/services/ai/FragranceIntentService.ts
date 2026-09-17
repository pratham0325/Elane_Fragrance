import { z } from 'zod';
import { getAIProvider, parseJsonResponse } from './AIProvider';
import { fragranceIntentPrompt } from './prompts';
import { FRAGRANCE_FAMILIES, GENDERS } from '../../types/enums';
import { logger } from '../../config/logger';

/** Validated shape of extracted intent. AI output is never trusted raw. */
export const searchIntentSchema = z.object({
  semanticQuery: z.string().default(''),
  budget: z
    .object({ min: z.number().nullable().default(null), max: z.number().nullable().default(null) })
    .default({ min: null, max: null }),
  occasion: z.array(z.string()).default([]),
  season: z.array(z.string()).default([]),
  sweetness: z.enum(['low', 'medium', 'high']).nullable().default(null),
  freshness: z.enum(['low', 'medium', 'high']).nullable().default(null),
  intensity: z.enum(['light', 'moderate', 'strong']).nullable().default(null),
  projection: z.enum(['low', 'moderate', 'high']).nullable().default(null),
  longevity: z.enum(['short', 'medium', 'long']).nullable().default(null),
  style: z.array(z.string()).default([]),
  gender: z.enum(GENDERS).nullable().default(null),
  fragranceFamilies: z.array(z.enum(FRAGRANCE_FAMILIES)).default([]),
  notes: z.array(z.string()).default([]),
  avoid: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5)
});

export type SearchIntent = z.infer<typeof searchIntentSchema>;

export interface IntentResult {
  intent: SearchIntent;
  usedFallback: boolean;
  tokens?: { prompt?: number; completion?: number; total?: number };
}

// ── Rule-based extraction (fallback when AI is unavailable) ─────────────────

const FAMILY_KEYWORDS: Record<string, string> = {
  woody: 'Woody', wood: 'Woody', sandalwood: 'Woody', cedar: 'Woody', oud: 'Woody',
  floral: 'Floral', flower: 'Floral', rose: 'Floral', jasmine: 'Floral',
  oriental: 'Oriental', amber: 'Oriental', spicy: 'Spicy', spice: 'Spicy',
  fresh: 'Fresh', clean: 'Fresh', citrus: 'Citrus', lemon: 'Citrus', bergamot: 'Citrus',
  sweet: 'Gourmand', vanilla: 'Gourmand', gourmand: 'Gourmand', caramel: 'Gourmand',
  aquatic: 'Aquatic', marine: 'Aquatic', ocean: 'Aquatic', sea: 'Aquatic',
  musk: 'Musky', musky: 'Musky'
};

const OCCASION_KEYWORDS = ['office', 'work', 'date', 'college', 'party', 'evening', 'daily',
  'everyday', 'wedding', 'formal', 'casual', 'gym', 'travel', 'night'];
const SEASON_KEYWORDS = ['summer', 'winter', 'monsoon', 'rainy', 'spring', 'autumn', 'fall'];
const STYLE_KEYWORDS = ['sophisticated', 'mature', 'youthful', 'luxurious', 'luxury', 'seductive',
  'clean', 'dark', 'warm', 'elegant', 'energetic', 'subtle', 'powerful', 'affordable', 'cheap',
  'expensive', 'bold', 'mysterious', 'romantic', 'calm'];

export function extractIntentRuleBased(query: string): SearchIntent {
  const q = query.toLowerCase();

  // Budget: "under 3000", "less than 2000", "below ₹1500", "under rs 2000"
  let max: number | null = null;
  let min: number | null = null;
  const maxMatch = q.match(/(?:under|below|less than|max|upto|up to|within|budget of)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
  if (maxMatch) max = parseInt(maxMatch[1].replace(/,/g, ''), 10);
  const minMatch = q.match(/(?:above|over|more than|at least|minimum)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
  if (minMatch) min = parseInt(minMatch[1].replace(/,/g, ''), 10);
  // Bare "₹3000" with no comparator also reads as a ceiling
  if (max === null && min === null) {
    const bare = q.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/);
    if (bare) max = parseInt(bare[1].replace(/,/g, ''), 10);
  }

  const families = Array.from(
    new Set(
      Object.entries(FAMILY_KEYWORDS)
        .filter(([kw]) => new RegExp(`\\b${kw}`, 'i').test(q))
        .map(([, fam]) => fam)
    )
  ).filter((f) => (FRAGRANCE_FAMILIES as readonly string[]).includes(f));

  const negated = /\b(?:not|don'?t|no|avoid|isn'?t|without)\b[^.]{0,25}\bsweet/.test(q);
  const sweetness = negated ? 'low' : /\bsweet|vanilla|caramel|gourmand\b/.test(q) ? 'high' : null;
  const freshness = /\bfresh|clean|citrus|light|summer|aquatic\b/.test(q) ? 'high' : null;

  const intensity = /\b(?:strong|powerful|beast|heavy|intense)\b/.test(q)
    ? 'strong'
    : /\b(?:subtle|light|soft|mild|not too strong|gentle)\b/.test(q)
      ? 'light'
      : null;

  let gender: SearchIntent['gender'] = null;
  if (/\b(?:for (?:him|men|man|male)|masculine)\b/.test(q)) gender = 'Men';
  else if (/\b(?:for (?:her|women|woman|female)|feminine)\b/.test(q)) gender = 'Women';
  else if (/\bunisex\b/.test(q)) gender = 'Unisex';

  return searchIntentSchema.parse({
    semanticQuery: query,
    budget: { min, max },
    occasion: OCCASION_KEYWORDS.filter((k) => q.includes(k)),
    season: SEASON_KEYWORDS.filter((k) => q.includes(k)),
    sweetness,
    freshness,
    intensity,
    projection: intensity === 'strong' ? 'high' : intensity === 'light' ? 'low' : null,
    longevity: /\blong.?lasting|all day|lasts\b/.test(q) ? 'long' : null,
    style: STYLE_KEYWORDS.filter((k) => q.includes(k)),
    gender,
    fragranceFamilies: families,
    notes: [],
    avoid: negated ? ['very sweet'] : [],
    confidence: 0.45 // deliberately lower — signals this was rule-based
  });
}

export async function extractIntent(query: string): Promise<IntentResult> {
  const provider = getAIProvider();

  if (!provider) {
    return { intent: extractIntentRuleBased(query), usedFallback: true };
  }

  try {
    // User text is passed as a delimited data block, never concatenated into
    // the system prompt — this is the main prompt-injection guard.
    const userBlock = `Extract search intent from this shopper message.\n\n<shopper_message>\n${query}\n</shopper_message>`;
    const res = await provider.chat(fragranceIntentPrompt, userBlock, 600);
    const raw = parseJsonResponse<unknown>(res.text);

    // Validate AI output; on schema failure we fall back rather than trust it.
    const parsed = searchIntentSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'AI intent failed schema validation — using rule-based fallback');
      return { intent: extractIntentRuleBased(query), usedFallback: true };
    }

    return {
      intent: parsed.data,
      usedFallback: false,
      tokens: { prompt: res.promptTokens, completion: res.completionTokens, total: res.totalTokens }
    };
  } catch (err) {
    logger.warn({ err }, 'AI intent extraction failed — using rule-based fallback');
    return { intent: extractIntentRuleBased(query), usedFallback: true };
  }
}
