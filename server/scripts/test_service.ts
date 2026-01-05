import { PrismaClient } from '@prisma/client';
import { WooService } from '../src/services/woo';

const prisma = new PrismaClient();

async function main() {
    const account = await prisma.account.findFirst({
        where: { wooUrl: { contains: 'localhost' } }
    });

    if (!account) return console.log("No localhost account found");

    console.log("Initializing Service for:", account.wooUrl);
    try {
        const svc = await WooService.forAccount(account.id);
        console.log("Service Initialized.");
        console.log("Fetching Orders...");
        const orders = await svc.getOrders({ per_page: 1 });
        console.log("Orders success:", orders.length);
    } catch (err: any) {
        console.log("Service Error:", err.message);
        if (err.cause) console.log("Cause:", err.cause);
    }
}

main().finally(() => prisma.$disconnect());
