
import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const account = await prisma.account.findFirst({
        where: {
            OR: [
                { name: { contains: 'Kings', mode: 'insensitive' } },
                { wooUrl: { contains: 'custom', mode: 'insensitive' } }
            ]
        }
    });

    if (account) {
        fs.writeFileSync('temp_id.txt', `ID: ${account.id}\nName: ${account.name}`);
        console.log("Wrote to temp_id.txt");
    } else {
        console.log("No Custom Kings account found");
    }
    await prisma.$disconnect();
}
main();
