import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { fragranceSearchSchema, productComparisonSchema } from '../validators/ai.validator';
import { fragranceSearch } from '../services/ai/FragranceSearchService';
import { compareProducts } from '../services/ai/ProductComparisonService';
import { getAIProvider } from '../services/ai/AIProvider';
import { env } from '../config/env';
import jwt from 'jsonwebtoken';

const router = Router();

/** AI calls cost money — tighter limit than the general API limiter. */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'You are searching very quickly. Please wait a moment before trying again.',
    errors: []
  }
});

/**
 * Optional auth: AI search works for guests, but we attach the user when a
 * valid token is present so usage can be attributed.
 */
function optionalAuth(req: Request, _res: Response, next: () => void) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as typeof req.user;
    } catch {
      /* ignore invalid token — continue as guest */
    }
  }
  next();
}

router.use(aiLimiter);

/** Lets the frontend show/hide AI affordances without leaking any config. */
router.get('/status', (_req, res) => {
  const provider = getAIProvider();
  sendSuccess(res, {
    available: Boolean(provider),
    label: 'Scent Intelligence'
  });
});

router.post(
  '/fragrance-search',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { query } = fragranceSearchSchema.parse(req.body);
    const result = await fragranceSearch(query, req.user?.userId);

    sendSuccess(res, {
      intent: result.intent,
      results: result.results.map((r) => ({
        productId: r.productId,
        matchScore: r.matchScore,
        reason: r.reason,
        matchedOn: r.matchedOn,
        product: r.product
      })),
      explanation: result.explanation,
      usedFallback: result.usedFallback,
      aiAvailable: result.aiAvailable,
      notice: result.notice
    });
  })
);

router.post(
  '/compare',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { productIds, needs } = productComparisonSchema.parse(req.body);
    const result = await compareProducts(productIds, needs, req.user?.userId);
    sendSuccess(res, result);
  })
);

export default router;
