import { Coupon } from '../models/Coupon.model';
import { ApiError } from '../utils/ApiError';

export async function validateCoupon(code: string, cartSubtotal: number) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw ApiError.badRequest('Invalid coupon code');
  if (coupon.expiresAt < new Date()) throw ApiError.badRequest('Coupon has expired');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
    throw ApiError.badRequest('Coupon usage limit reached');
  if (cartSubtotal < coupon.minCartAmount)
    throw ApiError.badRequest(`Minimum cart amount ₹${coupon.minCartAmount / 100} required`);

  const discount =
    coupon.discountType === 'PERCENTAGE'
      ? Math.round((cartSubtotal * coupon.discountValue) / 100)
      : coupon.discountValue;

  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discount,
    finalAmount: cartSubtotal - discount
  };
}

export async function incrementUsage(code: string) {
  await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}

export async function listCoupons() {
  return Coupon.find().sort({ createdAt: -1 });
}

export async function createCoupon(data: {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minCartAmount?: number;
  usageLimit?: number;
  expiresAt: Date;
}) {
  return Coupon.create(data);
}

export async function toggleCoupon(id: string, isActive: boolean) {
  const coupon = await Coupon.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return coupon;
}
