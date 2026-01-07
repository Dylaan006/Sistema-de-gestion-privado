import prisma from '../../prismaClient.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

export const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generate JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        mustChangePassword: user.mustChangePassword
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('Login error', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const userId = req.user.id; // From authMiddleware

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('Change password error', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};