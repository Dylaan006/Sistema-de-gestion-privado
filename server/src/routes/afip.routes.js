import { Router } from 'express';
import { checkCuit } from '../controllers/afip.controller.js';
import { requireStaff } from '../middlewares/roleMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/check-cuit/:cuit', requireStaff, checkCuit);

export default router;
