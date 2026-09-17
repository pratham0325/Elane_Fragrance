import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import * as couponService from '../services/coupon.service';
import { z } from 'zod';

const router = Router();

const createCouponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  minCartAmount: z.number().nonnegative().default(0),
  usageLimit: z.number().nonnegative().default(0),
  expiresAt: z.string().datetime()
});

// Public: validate coupon (no auth needed, but throttled by rate limiter)
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { code, cartSubtotal } = req.body;
  const result = await couponService.validateCoupon(code, cartSubtotal);
  sendSuccess(res, result);
}));

// Admin: list all coupons
router.get('/', requireAuth, requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await couponService.listCoupons();
  sendSuccess(res, coupons);
}));

// Admin: create coupon
router.post('/', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const data = createCouponSchema.parse(req.body);
  const coupon = await couponService.createCoupon({
    ...data,
    expiresAt: new Date(data.expiresAt)
  });
  sendSuccess(res, coupon, 'Coupon created', 201);
}));

// Admin: toggle active status
router.patch('/:id/toggle', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.toggleCoupon(req.params.id, req.body.isActive);
  sendSuccess(res, coupon);
}));

export default router;
