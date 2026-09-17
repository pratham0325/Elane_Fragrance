import { Review } from '../models/Review.model';
import { Product } from '../models/Product.model';
import { Order } from '../models/Order.model';
import { ApiError } from '../utils/ApiError';

export async function getProductReviews(productId: string, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ product: productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ product: productId, isApproved: true })
  ]);

  return { reviews, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function createReview(
  userId: string,
  productId: string,
  data: { rating: number; title: string; comment: string; images?: string[] }
) {
  // Check if user is verified buyer
  const order = await Order.findOne({
    user: userId,
    'items.product': productId,
    status: { $in: ['Delivered', 'Out for Delivery'] }
  });
  const isVerifiedBuyer = !!order;

  // Check for duplicate
  const existing = await Review.findOne({ user: userId, product: productId });
  if (existing) throw ApiError.conflict('You have already reviewed this product');

  const review = await Review.create({
    product: productId,
    user: userId,
    rating: Math.max(1, Math.min(5, data.rating)),
    title: data.title,
    comment: data.comment,
    images: data.images ?? [],
    isVerifiedBuyer,
    isApproved: true // Auto-approve for now; Phase 10+ adds moderation
  });

  // Update product rating
  const allReviews = await Review.find({ product: productId, isApproved: true });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await Product.findByIdAndUpdate(productId, {
    averageRating: parseFloat(avgRating.toFixed(1)),
    reviewCount: allReviews.length
  });

  return review;
}

export async function approveReview(reviewId: string) {
  const review = await Review.findByIdAndUpdate(reviewId, { isApproved: true }, { new: true });
  if (!review) throw ApiError.notFound('Review not found');
  return review;
}

export async function deleteReview(reviewId: string) {
  const review = await Review.findByIdAndDelete(reviewId);
  if (!review) throw ApiError.notFound('Review not found');
  // Recalc product rating
  const allReviews = await Review.find({ product: review.product, isApproved: true });
  const avgRating = allReviews.length ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0;
  await Product.findByIdAndUpdate(review.product, {
    averageRating: parseFloat(avgRating.toFixed(1)),
    reviewCount: allReviews.length
  });
}
