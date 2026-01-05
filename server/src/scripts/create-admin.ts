
import { PrismaClient } from '@prisma/client';
import { hash, genSalt } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@overseek.com';
    const password = 'password123';
    const fullName = 'System Admin';

    console.log(`Creating user: ${email}`);

    // 1. Hash Password
    const salt = await genSalt(10);
    const passwordHash = await hash(password, salt);

    // 2. Create User
    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { passwordHash }, // Reset password if exists
            create: {
                email,
                passwordHash,
                fullName,
                isSuperAdmin: true
            }
        });

        console.log('User created/updated successfully!');
        console.log('---------------------------------------------------');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('---------------------------------------------------');
        console.log('ID:', user.id);

    } catch (e) {
        console.error('Failed to create user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
