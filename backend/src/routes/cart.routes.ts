import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { requireAuth } from '../middleware/auth.middleware';
import * as cartService from '../services/cart.service';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.userId);
  sendSuccess(res, cart);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { productId, size, quantity = 1 } = req.body;
  const cart = await cartService.addItem(req.user!.userId, productId, size, quantity);
  sendSuccess(res, cart, 'Added to cart');
}));

router.put('/:itemId', asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateItem(req.user!.userId, req.params.itemId, req.body.quantity);
  sendSuccess(res, cart);
}));

router.delete('/:itemId', asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeItem(req.user!.userId, req.params.itemId);
  sendSuccess(res, cart, 'Item removed');
}));

export default router;
