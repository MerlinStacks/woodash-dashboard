/**
 * Webhook Route - Fastify Plugin
 * Handles WooCommerce webhooks
 */

import { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';
import { IndexingService } from '../services/search/IndexingService';
import { io } from '../app';

// Helper to verify WooCommerce Signature
const verifySignature = (payload: any, signature: string, secret: string): boolean => {
    const hash = crypto.createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('base64');

    try {
        const hashBuffer = Buffer.from(hash, 'utf8');
        const sigBuffer = Buffer.from(signature, 'utf8');
        if (hashBuffer.length !== sigBuffer.length) {
            return false;
        }
        return crypto.timingSafeEqual(hashBuffer, sigBuffer);
    } catch {
        return false;
    }
};

const webhookRoutes: FastifyPluginAsync = async (fastify) => {
    // Webhook Endpoint - no auth required (uses signature verification)
    fastify.post<{ Params: { accountId: string } }>('/:accountId', async (request, reply) => {
        try {
            const { accountId } = request.params;
            const signature = request.headers['x-wc-webhook-signature'] as string;
            const topic = request.headers['x-wc-webhook-topic'] as string;
            const body = request.body as any;

            if (!signature || !topic) {
                return reply.code(400).send('Missing headers');
            }

            Logger.info(`Received Webhook`, { accountId, topic });

            const account = await prisma.account.findUnique({ where: { id: accountId } });
            if (!account) return reply.code(404).send('Account not found');

            // SECURITY: Verify Signature
            const secret = account.webhookSecret || account.wooConsumerSecret;

            if (secret) {
                const isValid = verifySignature(body, signature, secret);

                if (!isValid) {
                    Logger.warn(`Invalid Webhook Signature`, { accountId });
                    return reply.code(401).send('Invalid Signature');
                }
            } else {
                Logger.warn(`No credentials to verify webhook`, { accountId });
                return reply.code(401).send('No Webhook Secret Configured');
            }

            // Handle Order Events
            if (topic === 'order.created' || topic === 'order.updated') {
                await IndexingService.indexOrder(accountId, body);

                if (topic === 'order.created') {
                    Logger.info(`[Webhook] New order received via webhook`, {
                        accountId,
                        orderId: body.id,
                        orderNumber: body.number,
                        total: body.total
                    });

                    await prisma.notification.create({
                        data: {
                            accountId,
                            title: 'New Order Received',
                            message: `Order #${body.number || body.id} has been placed.`,
                            type: 'SUCCESS',
                            link: '/orders'
                        }
                    });

                    // Emit socket event
                    io.to(`account:${accountId}`).emit('order:new', {
                        orderId: body.id,
                        orderNumber: body.number || body.id,
                        total: body.total,
                        customerName: body.billing?.first_name
                            ? `${body.billing.first_name} ${body.billing.last_name || ''}`.trim()
                            : 'Guest'
                    });

                    // Send push notification
                    Logger.warn(`[Webhook] Attempting push notification for new order`, {
                        accountId,
                        orderId: body.id,
                        orderNumber: body.number
                    });

                    const { PushNotificationService } = require('../services/PushNotificationService');
                    const pushResult = await PushNotificationService.sendToAccount(accountId, {
                        title: '🛒 New Order!',
                        body: `Order #${body.number || body.id} - $${body.total}`,
                        data: { url: '/orders' }
                    }, 'order');

                    Logger.warn(`[Webhook] Push notification result`, { accountId, ...pushResult });
                }
                Logger.info(`Indexed Order`, { orderId: body.id, accountId });
            }

            // Handle Product Events
            if (topic === 'product.created' || topic === 'product.updated') {
                await IndexingService.indexProduct(accountId, body);
                Logger.info(`Indexed Product`, { productId: body.id, accountId });
            }

            // Handle Customer Events
            if (topic === 'customer.created' || topic === 'customer.updated') {
                await IndexingService.indexCustomer(accountId, body);
                Logger.info(`Indexed Customer`, { customerId: body.id, accountId });
            }

            return reply.code(200).send('Webhook received');
        } catch (error) {
            Logger.error('Webhook Error', { error });
            return reply.code(500).send('Server Error');
        }
    });
};

export default webhookRoutes;
