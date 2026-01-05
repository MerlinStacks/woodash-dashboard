import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const accounts = await prisma.account.findMany();
    console.log(JSON.stringify(accounts.map(a => ({ id: a.id, name: a.name, url: a.wooUrl })), null, 2));
}
main().finally(() => prisma.$disconnect());
