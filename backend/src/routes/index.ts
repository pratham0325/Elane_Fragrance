import { Router } from 'express';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import authRoutes from './auth.routes';
import cartRoutes from './cart.routes';
import wishlistRoutes from './wishlist.routes';
import orderRoutes from './order.routes';
import reviewRoutes from './review.routes';
import couponRoutes from './coupon.routes';
import adminRoutes from './admin.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ success: true, message: 'ÉLANÉ API v1' });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);

export default router;
