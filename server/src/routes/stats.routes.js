import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireStaff } from '../middlewares/roleMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Only Staff/Admin can see Dashboard stats
router.get('/dashboard', requireStaff, getDashboardStats);

export default router;
