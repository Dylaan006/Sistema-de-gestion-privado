import { Router } from 'express';
import { adjustStock, getMovements } from '../controllers/stock.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/adjust', adjustStock);
router.get('/movements', getMovements);

export default router;
