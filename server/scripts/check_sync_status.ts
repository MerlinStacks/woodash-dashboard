import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('--- Checking Sync Status ---');

    // Check Logs
    const logs = await prisma.syncLog.findMany({
        take: 5,
        orderBy: { startedAt: 'desc' }
    });

    console.log('\nLatest Sync Logs:');
    if (logs.length === 0) console.log('No sync logs found.');
    logs.forEach(log => {
        console.log(`[${log.startedAt.toISOString()}] ${log.entityType}: ${log.status} (Processed: ${log.itemsProcessed})`);
        if (log.errorMessage) console.log(`   Error: ${log.errorMessage}`);
    });

    // Check Counts
    const products = await prisma.wooProduct.count();
    const orders = await prisma.wooOrder.count();
    const customers = await prisma.wooCustomer.count();

    console.log('\nDatabase Counts:');
    console.log(`Products: ${products}`);
    console.log(`Orders: ${orders}`);
    console.log(`Customers: ${customers}`);

    // Check Account
    const account = await prisma.account.findFirst();
    if (account) {
        console.log(`\nAccount: ${account.name} (${account.domain})`);
        console.log(`WooURL: ${account.wooUrl}`);
    } else {
        console.log('\nNo account found!');
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
