import { Router } from 'express';
import { createUser, disableUser, getUsers } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// Todas las rutas de usuarios requieren ser ADMIN (y estar autenticado)
router.use(authMiddleware, requireAdmin);

router.post('/', createUser);
router.get('/', getUsers);
router.patch('/:id/disable', disableUser);

export default router;
