import prisma from '../../prismaClient.js';
import { hashPassword } from '../utils/password.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'STAFF', 'OPERATOR']).default('OPERATOR')
});

export const createUser = async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) return res.status(400).json({ error: 'El email ya registrado' });

    const hashedPassword = await hashPassword(data.password);

    const newUser = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        mustChangePassword: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json(newUser);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('Create user error', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const disableUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Convert id to number (Prisma uses Int)
    const userId = parseInt(id, 10);
    if (isNaN(userId)) return res.status(400).json({ error: 'ID inválido' });

    // Prevent disabling yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true }
    });

    res.json(updatedUser);

  } catch (error) {
    logger.error('Disable user error', error);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
};
