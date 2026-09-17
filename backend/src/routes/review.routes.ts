import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import * as reviewService from '../services/review.service';
import { z } from 'zod';

const router = Router();

const createReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().min(3),
  comment: z.string().min(10),
  images: z.array(z.string()).optional()
});

// Public: get reviews for a product
router.get('/:productId', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = await reviewService.getProductReviews(req.params.productId, 20, page);
  sendSuccess(res, result);
}));

// Customer: submit review
router.post('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { productId, rating, title, comment, images } = createReviewSchema.parse(req.body);
  const review = await reviewService.createReview(req.user!.userId, productId, {
    rating,
    title,
    comment,
    images
  });
  sendSuccess(res, review, 'Review submitted', 201);
}));

// Admin: approve review
router.patch('/:id/approve', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.approveReview(req.params.id);
  sendSuccess(res, review);
}));

// Admin: delete review
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  await reviewService.deleteReview(req.params.id);
  sendSuccess(res, null, 'Review deleted');
}));

export default router;
