import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@mitienda.com'; // 1. Cambiá esto por el email real
  const passwordRaw = 'passwordSegura12';       // 2. Cambiá esto por la contraseña real
  const name = 'Admin Principal';

  const hashedPassword = await bcrypt.hash(passwordRaw, 10);

  // Usamos upsert: Si existe lo actualiza, si no, lo crea.
  // Esto evita errores si corrés el script dos veces.
  const user = await prisma.user.upsert({
    where: { email: email },
    update: {
        password: hashedPassword, // Permite resetear la pass si te olvidás
    },
    create: {
      email: email,
      name: name,
      password: hashedPassword
    },
  });

  console.log(`✅ Usuario gestionado con éxito: ${user.email}`);
}

main()
  .catch((e) => {
    console.error("❌ Error creando usuario:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });