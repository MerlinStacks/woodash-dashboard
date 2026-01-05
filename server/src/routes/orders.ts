import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get Order by ID (Internal ID or WooID)
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const accountId = req.headers['x-account-id'] as string; // accountId is usually passed via middleware or header

    if (!accountId) {
        return res.status(400).json({ error: 'accountId header is required' });
    }

    console.log(`[API] Fetching order ${id} for account ${accountId}`);

    try {
        let order;

        // Try finding by internal UUID first
        order = await prisma.wooOrder.findUnique({
            where: { id: id }
        });

        // If not found and ID is numeric, try finding by WooID
        if (!order && !isNaN(Number(id))) {
            console.log(`[API] ID is numeric, trying lookup by wooId: ${id}`);
            order = await prisma.wooOrder.findUnique({
                where: {
                    accountId_wooId: {
                        accountId,
                        wooId: Number(id)
                    }
                }
            });
        }

        if (!order) {
            console.warn(`[API] Order ${id} not found in DB`);
            return res.status(404).json({ error: 'Order not found' });
        }

        // Ensure the order belongs to the requesting account (security check)
        if (order.accountId !== accountId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Return the raw data which contains all the nice Woo fields
        // We also merge the internal status/id for convenience
        res.json({
            ...order.rawData as object,
            internal_id: order.id,
            internal_status: order.status,
            internal_updated_at: order.updatedAt
        });

    } catch (error) {
        console.error('Failed to fetch order:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

export default router;
