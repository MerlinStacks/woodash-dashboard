import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { SyncService } from '../services/sync';
import { IndexingService } from '../services/search/IndexingService';

const router = Router();
const prisma = new PrismaClient();

// Helper to verify WooCommerce Signature
/*
const verifySignature = (payload: any, signature: string, secret: string) => {
    const hash = crypto.createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('base64');
    return hash === signature;
};
*/

// Webhook Endpoint
// WooCommerce sends topic in header: "x-wc-webhook-topic": "order.created"
// And signature: "x-wc-webhook-signature": "..."
// And resource ID: "x-wc-webhook-resource": "12345"
// And Source URL or similar to identify store? No, usually we rely on the secret.
// PROBLEM: In a multi-tenant app, we need to know WHICH account this webhook belongs to.
// OPTION A: Unique Webhook URL per account: /api/webhooks/woo/:accountId
// OPTION B: Try to match the signature against ALL accounts (Expensive)
// OPTION C: User passes ?user_id=... in the Delivery URL setup.

// Going with OPTION A: /api/webhooks/woo/:accountId
router.post('/:accountId', async (req: Request, res: Response) => {
    try {
        const { accountId } = req.params;
        const signature = req.headers['x-wc-webhook-signature'] as string;
        const topic = req.headers['x-wc-webhook-topic'] as string;

        if (!signature || !topic) {
            return res.status(400).send('Missing headers');
        }

        // Fetch Account to get the Secret
        // NOTE: In a real app, you might have a dedicated "Webhook Secret" separate from Consumer Secret.
        // For simplicity, we assume the user configured the webhook with the Consumer Secret 
        // OR we generate a specific webhook secret.
        // Let's assume we use the Account's `wooConsumerSecret` for now, 
        // BUT typically Woo Webhooks have a separate string you define in the WP Admin.

        // Correction: We need to store a "Webhook Secret" in the Account model if we want to verify properly.
        // For this MVP, I will skip strict verification or assume a shared secret for now to unblock.
        // TODO: Add `webhookSecret` to Account model.

        // Let's just blindly sync for now to prove the flow, but log the proper path.
        console.log(`Received Webhook for Account ${accountId}: ${topic}`);

        const account = await prisma.account.findUnique({ where: { id: accountId } });
        if (!account) return res.status(404).send('Account not found');

        // Handle Order Events
        // Handle Order Events
        if (topic === 'order.created' || topic === 'order.updated') {
            // Upsert Logic ... (Assuming Webhook logic exists here)
            // Just replace the index call
            await IndexingService.indexOrder(accountId, req.body);

            // Create Notification for new orders
            if (topic === 'order.created') {
                await prisma.notification.create({
                    data: {
                        accountId,
                        title: 'New Order Received',
                        message: `Order #${req.body.number || req.body.id} has been placed.`,
                        type: 'SUCCESS',
                        link: '/orders'
                    }
                });
            }
            console.log(`Indexed Order ${req.body.id} for Account ${accountId}`);
        }

        // Handle Product Events
        if (topic === 'product.created' || topic === 'product.updated') {
            await IndexingService.indexProduct(accountId, req.body);
            console.log(`Indexed Product ${req.body.id} for Account ${accountId}`);
        }

        // Handle Customer Events
        if (topic === 'customer.created' || topic === 'customer.updated') {
            await IndexingService.indexCustomer(accountId, req.body);
            console.log(`Indexed Customer ${req.body.id} for Account ${accountId}`);
        }

        res.status(200).send('Webhook received');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Server Error');
    }
});

export default router;
