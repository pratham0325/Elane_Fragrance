import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { requireAuth } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId).populate('wishlist', 'name slug thumbnail price averageRating fragranceFamily');
  sendSuccess(res, user?.wishlist ?? []);
}));

router.post('/:productId', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) throw ApiError.unauthorized();
  const pid = new Types.ObjectId(req.params.productId);
  const alreadyIn = user.wishlist.some((id) => id.equals(pid));
  if (!alreadyIn) user.wishlist.push(pid);
  await user.save();
  sendSuccess(res, { wishlistCount: user.wishlist.length }, alreadyIn ? 'Already in wishlist' : 'Added to wishlist');
}));

router.delete('/:productId', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) throw ApiError.unauthorized();
  user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  await user.save();
  sendSuccess(res, { wishlistCount: user.wishlist.length }, 'Removed from wishlist');
}));

export default router;
