import { Router } from 'express';
import * as cc from '../controllers/category.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', cc.getCategories);
router.get('/:slug', cc.getCategoryBySlug);
router.post('/', requireAuth, requireAdmin, cc.createCategory);
router.put('/:id', requireAuth, requireAdmin, cc.updateCategory);

export default router;
