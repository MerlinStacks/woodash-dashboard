
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const customerId = args[0];

    if (!customerId) {
        console.error('Please provide a customer ID');
        return;
    }

    console.log(`Searching for customer: ${customerId}`);

    // Check if numeric
    const isWooId = !isNaN(Number(customerId));
    console.log(`Is WooId (Numeric): ${isWooId}`);

    // Search by WooId
    if (isWooId) {
        console.log('Querying by wooId:', customerId);
        const byWooId = await prisma.wooCustomer.findFirst({
            where: { wooId: Number(customerId) }
        });
        console.log('WooId Result:', byWooId ? 'FOUND' : 'NOT FOUND');
    }

    console.log('Querying by id (UUID):', customerId);
    try {
        const byUuid = await prisma.wooCustomer.findFirst({
            where: { id: customerId }
        });
        console.log('UUID Result:', byUuid ? 'FOUND' : 'NOT FOUND');
    } catch (e) {
        console.log('UUID Error:', e.message);
    }

    const one = await prisma.wooCustomer.findFirst();
    if (one) {
        console.log(`Sample: WooID=${one.wooId}, ID=${one.id}, Account=${one.accountId}`);
    }

    if (isWooId) {
        const globalFind = await prisma.wooCustomer.findFirst({
            where: { wooId: Number(customerId) }
        });
        if (globalFind) {
            console.log(`FOUND_ACCOUNT: ${globalFind.accountId}`);
        } else {
            console.log(`Result: MISSING`);
        }
    }

}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
