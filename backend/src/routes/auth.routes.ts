import { Router } from 'express';
import * as ac from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', authLimiter, ac.register);
router.post('/login', authLimiter, ac.login);
router.post('/refresh', ac.refresh);
router.post('/logout', requireAuth, ac.logout);
router.get('/me', requireAuth, ac.getMe);
router.put('/me', requireAuth, ac.updateProfile);
router.put('/change-password', requireAuth, ac.changePassword);

export default router;
