import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { Order } from '../models/Order.model';
import { Product } from '../models/Product.model';
import { User } from '../models/User.model';
import { Review } from '../models/Review.model';
import * as orderService from '../services/order.service';
import * as productService from '../services/product.service';
import { productQuerySchema, createProductSchema, updateProductSchema } from '../validators/product.validator';
import { AiUsage } from '../models/AiUsage.model';
import { reindexProducts, getIndexStatus } from '../services/ai/EmbeddingService';
import { reindexSchema } from '../validators/ai.validator';
import { z } from 'zod';

const router = Router();
router.use(requireAuth, requireAdmin);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get('/dashboard', asyncHandler(async (_req: Request, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalOrders,
    revenueAgg,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockProducts,
    recentOrders,
    revenueByDay,
    ordersByStatus,
    topProducts,
    salesByFamily,
    salesByGender,
    newCustomers7d,
    newOrders7d
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]),
    User.countDocuments({ role: 'CUSTOMER' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments({ status: 'Placed' }),
    Product.find({ isActive: true, 'sizes.stock': { $lt: 10 } })
      .select('name thumbnail sizes')
      .limit(10),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email'),
    // Revenue by day for last 30 days
    Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: 'PAID' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    // Top products by revenue
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, units: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]),
    // Sales by fragrance family
    Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.fragranceFamily', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } }
    ]),
    // Sales by gender
    Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.gender', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
    ]),
    User.countDocuments({ role: 'CUSTOMER', createdAt: { $gte: sevenDaysAgo } }),
    Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
  ]);

  sendSuccess(res, {
    summary: {
      totalOrders,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      totalCustomers,
      totalProducts,
      pendingOrders,
      newCustomers7d,
      newOrders7d
    },
    lowStockProducts,
    recentOrders,
    charts: {
      revenueByDay,
      ordersByStatus: Object.fromEntries(ordersByStatus.map((x: { _id: string; count: number }) => [x._id, x.count])),
      topProducts,
      salesByFamily,
      salesByGender
    }
  });
}));

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
router.get('/products', asyncHandler(async (req: Request, res: Response) => {
  const query = productQuerySchema.parse({ ...req.query, limit: req.query.limit ?? '20' });
  // Admin can see inactive products too
  const result = await Product.find({})
    .sort({ createdAt: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .populate('category', 'name');
  const total = await Product.countDocuments({});
  sendSuccess(res, { items: result, pagination: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) } });
}));

router.post('/products', asyncHandler(async (req: Request, res: Response) => {
  const input = createProductSchema.parse(req.body);
  const product = await productService.createProduct(input);
  sendSuccess(res, { product }, 'Product created successfully', 201);
}));

router.put('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const input = updateProductSchema.parse(req.body);
  const product = await productService.updateProduct(req.params.id, input);
  sendSuccess(res, { product }, 'Product updated successfully');
}));

router.delete('/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.deactivateProduct(req.params.id);
  sendSuccess(res, { product }, 'Product deleted successfully');
}));

// ── ORDERS ────────────────────────────────────────────────────────────────────
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email'),
    Order.countDocuments(filter)
  ]);
  sendSuccess(res, { orders, total, page, totalPages: Math.ceil(total / limit) });
}));

router.get('/orders/:id', asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrder(req.params.id);
  sendSuccess(res, order);
}));

const updateStatusSchema = z.object({ status: z.string(), note: z.string().optional() });
router.patch('/orders/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = updateStatusSchema.parse(req.body);
  const order = await orderService.updateOrderStatus(req.params.id, status as any, note);
  sendSuccess(res, order, 'Status updated');
}));

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
router.get('/customers', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const search = req.query.search as string | undefined;
  const filter: Record<string, unknown> = { role: 'CUSTOMER' };
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-passwordHash -refreshTokenHash'),
    User.countDocuments(filter)
  ]);
  sendSuccess(res, { customers, total, page, totalPages: Math.ceil(total / limit) });
}));

router.patch('/customers/:id/toggle', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true }).select('-passwordHash');
  sendSuccess(res, user, 'Customer status updated');
}));

// ── REVIEWS ───────────────────────────────────────────────────────────────────
router.get('/reviews', asyncHandler(async (_req: Request, res: Response) => {
  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('user', 'name email')
    .populate('product', 'name slug');
  sendSuccess(res, reviews);
}));

// ── INVENTORY ─────────────────────────────────────────────────────────────────
router.get('/inventory', asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find({ isActive: true })
    .select('name thumbnail sizes averageRating reviewCount')
    .sort({ 'sizes.stock': 1 });
  sendSuccess(res, products);
}));

router.patch('/inventory/:id/stock', asyncHandler(async (req: Request, res: Response) => {
  const { size, stock } = req.body;
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, 'sizes.size': size },
    { $set: { 'sizes.$.stock': stock } },
    { new: true }
  );
  sendSuccess(res, product, 'Stock updated');
}));

// ── AI MANAGEMENT (Scent Intelligence) ───────────────────────────────────────
router.get('/ai/status', asyncHandler(async (_req: Request, res: Response) => {
  const [index, usage] = await Promise.all([
    getIndexStatus(),
    AiUsage.aggregate([
      {
        $group: {
          _id: '$feature',
          total: { $sum: 1 },
          successful: { $sum: { $cond: ['$success', 1, 0] } },
          failed: { $sum: { $cond: ['$success', 0, 1] } },
          fallbacks: { $sum: { $cond: ['$usedFallback', 1, 0] } },
          avgLatencyMs: { $avg: '$latencyMs' },
          totalTokens: { $sum: '$totalTokens' }
        }
      }
    ])
  ]);

  const byFeature = Object.fromEntries(
    usage.map((u: any) => [
      u._id,
      {
        total: u.total,
        successful: u.successful,
        failed: u.failed,
        fallbacks: u.fallbacks,
        avgLatencyMs: Math.round(u.avgLatencyMs ?? 0),
        totalTokens: u.totalTokens ?? 0
      }
    ])
  );

  sendSuccess(res, {
    index,
    usage: {
      byFeature,
      totalRequests: usage.reduce((sum: number, u: any) => sum + u.total, 0),
      totalFailures: usage.reduce((sum: number, u: any) => sum + u.failed, 0)
    }
  });
}));

router.post('/ai/reindex', asyncHandler(async (req: Request, res: Response) => {
  const { force, productId } = reindexSchema.parse(req.body ?? {});
  const result = await reindexProducts({ force, productId });
  sendSuccess(res, result, `Indexed ${result.indexed}, skipped ${result.skipped}, failed ${result.failed}`);
}));

router.get('/ai/usage', asyncHandler(async (_req: Request, res: Response) => {
  const recent = await AiUsage.find().sort({ createdAt: -1 }).limit(50).populate('user', 'name email');
  sendSuccess(res, recent);
}));

export default router;
