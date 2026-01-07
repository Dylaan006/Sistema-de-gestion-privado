import prisma from './prismaClient.js';
import { hashPassword } from './src/utils/password.js';

async function main() {
    // Get arguments: node create-company.js "Name" "Email" "Pass"
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.error('❌ Usage: node create-company.js "<CompanyName>" "<AdminEmail>" "<Password>"');
        process.exit(1);
    }

    const [companyName, email, password] = args;

    try {
        console.log(`Creating organization: "${companyName}"...`);

        // 1. Create Organization
        const org = await prisma.organization.create({
            data: { name: companyName }
        });

        console.log(`✅ Organization created with ID: ${org.id}`);

        // 2. Create Search Admin User
        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Admin',
                role: 'ADMIN',
                organizationId: org.id,
                mustChangePassword: true
            }
        });

        console.log(`✅ Admin user created: ${user.email} (ID: ${user.id})`);
        console.log('Done!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'P2002') {
            console.error('   (Probably naming collision: Email or Company Name already exists)');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
