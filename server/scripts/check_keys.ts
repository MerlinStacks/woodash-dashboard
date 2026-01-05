import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const accounts = await prisma.account.findMany();
    console.log(`Found ${accounts.length} accounts:`);
    accounts.forEach(acc => {
        console.log(`\nID: ${acc.id}`);
        console.log(`URL: ${acc.wooUrl}`);
        const k = acc.wooConsumerKey;
        const s = acc.wooConsumerSecret;
        console.log(`Key: ${k.substring(0, 5)}...${k.slice(-4)} (Len: ${k.length})`);
        console.log(`Secret: ${s.substring(0, 5)}...${s.slice(-4)} (Len: ${s.length})`);
    });
}
main().finally(() => prisma.$disconnect());
