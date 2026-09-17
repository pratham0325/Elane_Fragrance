import { z } from 'zod';
import { env } from '../config/env';

/**
 * Strips characters/sequences commonly used in prompt-injection attempts.
 * Defence in depth — prompts also wrap user text in delimited data blocks.
 */
export function sanitizeQuery(input: string): string {
  return input
    .replace(/<\/?(?:system|assistant|user|shopper_message|shopper_needs)>/gi, '')
    .replace(/```/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const fragranceSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(3, 'Please describe what you are looking for')
    .max(env.AI_MAX_QUERY_LENGTH, `Query must be under ${env.AI_MAX_QUERY_LENGTH} characters`)
    .transform(sanitizeQuery)
    .refine((v) => v.length >= 3, 'Please describe what you are looking for')
});

export const productComparisonSchema = z.object({
  productIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id'))
    .min(2, 'Select at least 2 fragrances to compare')
    .max(3, 'You can compare up to 3 fragrances'),
  needs: z
    .string()
    .trim()
    .max(env.AI_MAX_QUERY_LENGTH)
    .transform(sanitizeQuery)
    .optional()
});

export const reindexSchema = z.object({
  force: z.boolean().optional().default(false),
  productId: z.string().regex(/^[a-f\d]{24}$/i).optional()
});
