import { Router } from 'express';
import { createSale, getSalePdf, getAllSales, createCreditNote } from '../controllers/sale.controller.js';
import { getDashboardStats } from '../controllers/stats.controller.js';
import { requireStaff, requireAdmin } from '../middlewares/roleMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Sales: Staff can sell.
// Sales: Staff can sell.
router.get('/sales', requireStaff, getAllSales);
router.post('/sales', requireStaff, createSale);
router.get('/sales/:id/pdf', requireStaff, getSalePdf);
router.post('/sales/:id/refund', requireStaff, createCreditNote);

// Stats: Usually Admin only? Or Staff needs to see how much they sold?
// Let's restrict Stats to ADMIN for now to be safe.
router.get('/stats/dashboard', requireAdmin, getDashboardStats);

export default router;
