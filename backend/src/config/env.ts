import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(10, 'JWT_ACCESS_SECRET must be set and reasonably long'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET must be set and reasonably long'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),

  // ── Scent Intelligence (AI layer) ──────────────────────────────────────
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'none']).default('none'),
  AI_API_KEY: z.string().optional().default(''),
  AI_BASE_URL: z.string().optional().default(''),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  AI_TIMEOUT_MS: z.coerce.number().default(15000),
  AI_MAX_QUERY_LENGTH: z.coerce.number().default(500),
  AI_VECTOR_SEARCH: z.coerce.boolean().default(false),
  AI_CACHE_TTL_MS: z.coerce.number().default(300000)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

/** Scent Intelligence is only "on" when a provider AND key are configured. */
export const isAIEnabled = env.AI_PROVIDER !== 'none' && env.AI_API_KEY.length > 0;
