import { Router } from 'express';
import { createProduct, getProducts, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { adjustStock, getMovements } from '../controllers/stock.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireStaff, requireAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// Middleware: All routes require Auth
router.use(authMiddleware);

// Products: Staff can read/write? 
// Requirement: Admin/Staff can manage.
// Let's allow Staff to Create/Edit for now. 
// If strict, maybe only Admin creates? 
// Usually Staff needs to create products too.
router.post('/products', requireStaff, createProduct);
router.get('/products', requireStaff, getProducts); // Staff & Admin & ReadOnly? ReadOnly should see too.
router.put('/products/:id', requireStaff, updateProduct);
router.delete('/products/:id', requireStaff, deleteProduct);

// Stock routes are handled in stock.routes.js
// router.post('/stock/adjust', requireStaff, adjustStock);
// router.get('/stock/movements', requireStaff, getMovements);

export default router;
