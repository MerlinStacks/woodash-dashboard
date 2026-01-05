import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    let account = await prisma.account.findFirst();
    if (!account) {
        console.log('Seeding test account...');
        account = await prisma.account.create({
            data: {
                name: 'Test Store',
                wooUrl: 'https://example.com',
                wooConsumerKey: 'ck_test',
                wooConsumerSecret: 'cs_test'
            }
        });
    }
    console.log('ACCOUNT_ID=' + account.id);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
