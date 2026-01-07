import prisma from './prismaClient.js';
import { hashPassword } from './src/utils/password.js';

async function main() {
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'admin123';

  // Create default organization
  let org = await prisma.organization.findFirst({ where: { name: 'Main Organization' } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Main Organization' }
    });
    console.log('Organization created');
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Super Admin',
        mustChangePassword: false,
        organizationId: org.id
      }
    });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });