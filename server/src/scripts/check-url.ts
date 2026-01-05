
import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const account = await prisma.account.findFirst();
    console.log("Woo URL:", account?.wooUrl);
    await prisma.$disconnect();
}
main();
