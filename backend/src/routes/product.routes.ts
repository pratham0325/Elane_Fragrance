import { Router } from 'express';
import * as pc from '../controllers/product.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public
router.get('/', pc.getProducts);
router.get('/featured', pc.getFeaturedProducts);
router.get('/new-arrivals', pc.getNewArrivals);
router.get('/best-sellers', pc.getBestSellers);
router.get('/:slug', pc.getProductBySlug);

// Admin only
router.post('/', requireAuth, requireAdmin, pc.createProduct);
router.put('/:id', requireAuth, requireAdmin, pc.updateProduct);
router.delete('/:id', requireAuth, requireAdmin, pc.deleteProduct);

export default router;
