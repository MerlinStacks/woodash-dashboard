import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const account = await prisma.account.findFirst();
    console.log("CURRENT_URL:", account?.wooUrl);
    console.log("CURRENT_KEY:", account?.wooConsumerKey);
}
main().finally(() => prisma.$disconnect());
