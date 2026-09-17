import { z } from 'zod';
import { CONCENTRATIONS, FRAGRANCE_FAMILIES, GENDERS } from '../types/enums';

export const productQuerySchema = z.object({
  search: z.string().optional(),
  gender: z.enum(GENDERS).optional(),
  fragranceFamily: z.enum(FRAGRANCE_FAMILIES).optional(),
  concentration: z.enum(CONCENTRATIONS).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  category: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  isBestSeller: z.coerce.boolean().optional(),
  sort: z
    .enum(['newest', 'price_asc', 'price_desc', 'rating', 'bestselling', 'featured'])
    .default('newest'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(60).default(12)
});

export const createProductSchema = z.object({
  name: z.string().min(2),
  brand: z.string().default('ÉLANÉ'),
  description: z.string().min(10),
  shortDescription: z.string().min(5),
  category: z.string(),
  gender: z.enum(GENDERS),
  fragranceFamily: z.enum(FRAGRANCE_FAMILIES),
  concentration: z.enum(CONCENTRATIONS),
  topNotes: z.array(z.string()).default([]),
  middleNotes: z.array(z.string()).default([]),
  baseNotes: z.array(z.string()).default([]),
  scentProfile: z
    .object({
      freshness: z.number().min(0).max(100),
      sweetness: z.number().min(0).max(100),
      woody: z.number().min(0).max(100),
      spicy: z.number().min(0).max(100),
      projection: z.number().min(0).max(100),
      longevity: z.number().min(0).max(100)
    })
    .partial()
    .optional(),
  ingredients: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  thumbnail: z.string(),
  sizes: z
    .array(
      z.object({
        size: z.string(),
        price: z.number().positive(),
        compareAtPrice: z.number().positive().optional(),
        sku: z.string(),
        stock: z.number().min(0)
      })
    )
    .min(1),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  tags: z.array(z.string()).default([])
});

export const updateProductSchema = createProductSchema.partial();
