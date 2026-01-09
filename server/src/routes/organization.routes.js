import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/organization.controller.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin); // Only admins can change company settings

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
