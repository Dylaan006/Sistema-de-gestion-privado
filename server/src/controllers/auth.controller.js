import { prisma } from '../../prisma/client.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import jwt from 'jsonwebtoken';


const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria")
});

export const login = async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

      if (!user.isActive) {
    return res.status(403).json({ error: 'Usuario deshabilitado' });
  }

  if (user.mustChangePassword) {
    return res.json({
    mustChangePassword: true
  });

  }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: "Bienvenido al sistema",
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};