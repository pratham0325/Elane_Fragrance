import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import * as orderService from '../services/order.service';
import { ApiError } from '../utils/ApiError';
import { z } from 'zod';

const router = Router();

const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('India'),
  }),
  paymentMethod: z.enum(['COD', 'ONLINE']),
  couponCode: z.string().optional()
});

router.post('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddress, paymentMethod, couponCode } = createOrderSchema.parse(req.body);
  const order = await orderService.createOrderDirect(req.user!.userId, { shippingAddress, paymentMethod, couponCode });
  sendSuccess(res, order, 'Order placed successfully', 201);
}));

router.get('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.getOrders(req.user!.userId);
  sendSuccess(res, orders);
}));

router.get('/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrder(req.params.id, req.user!.role === 'ADMIN' ? undefined : req.user!.userId);
  sendSuccess(res, order);
}));

router.patch('/:id/status', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = z.object({ status: z.string(), note: z.string().optional() }).parse(req.body);
  const order = await orderService.updateOrderStatus(req.params.id, status, note);
  sendSuccess(res, order, 'Status updated');
}));

export default router;
