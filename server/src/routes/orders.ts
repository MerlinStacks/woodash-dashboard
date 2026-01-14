/**
 * Orders Route - Fastify Plugin
 */

import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';
import { requireAuthFastify } from '../middleware/auth';
import { z } from 'zod';

const orderIdParamSchema = z.object({
    id: z.union([
        z.string().uuid(),
        z.string().regex(/^\d+$/, "ID must be a UUID or a numeric string")
    ])
});

const ordersRoutes: FastifyPluginAsync = async (fastify) => {
    // Protect all order routes
    fastify.addHook('preHandler', requireAuthFastify);

    // Get Order by ID (Internal ID or WooID)
    fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const { id } = orderIdParamSchema.parse(request.params);
        const accountId = request.user?.accountId;

        if (!accountId) {
            return reply.code(400).send({ error: 'accountId header is required' });
        }

        try {
            let order;

            // Try finding by internal UUID first
            order = await prisma.wooOrder.findUnique({
                where: { id: id }
            });

            // If not found and ID is numeric, try finding by WooID
            if (!order && !isNaN(Number(id))) {
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
                return reply.code(404).send({ error: 'Order not found' });
            }

            // Ensure the order belongs to the requesting account (security check)
            if (order.accountId !== accountId) {
                return reply.code(403).send({ error: 'Access denied' });
            }

            // Lookup customer metadata for order count
            const rawData = order.rawData as { customer_id?: number };
            let customerMeta = null;

            if (rawData.customer_id && rawData.customer_id > 0) {
                const customer = await prisma.wooCustomer.findUnique({
                    where: {
                        accountId_wooId: {
                            accountId,
                            wooId: rawData.customer_id
                        }
                    },
                    select: {
                        id: true,
                        wooId: true,
                        ordersCount: true
                    }
                });

                if (customer) {
                    customerMeta = {
                        internalId: customer.id,
                        wooId: customer.wooId,
                        ordersCount: customer.ordersCount
                    };
                }
            }

            // Return the raw data which contains all the nice Woo fields
            return {
                ...order.rawData as object,
                internal_id: order.id,
                internal_status: order.status,
                internal_updated_at: order.updatedAt,
                _customerMeta: customerMeta
            };

        } catch (error) {
            Logger.error('Failed to fetch order', { error });
            return reply.code(500).send({ error: 'Failed to fetch order details' });
        }
    });

    // Get Fraud Score for an Order
    fastify.get<{ Params: { id: string } }>('/:id/fraud-score', async (request, reply) => {
        const { id } = orderIdParamSchema.parse(request.params);
        const accountId = request.user?.accountId;

        if (!accountId) {
            return reply.code(400).send({ error: 'accountId header is required' });
        }

        try {
            let order;

            // Try finding by internal UUID first
            order = await prisma.wooOrder.findUnique({ where: { id } });

            // If not found and ID is numeric, try finding by WooID
            if (!order && !isNaN(Number(id))) {
                order = await prisma.wooOrder.findUnique({
                    where: { accountId_wooId: { accountId, wooId: Number(id) } }
                });
            }

            if (!order || order.accountId !== accountId) {
                return reply.code(404).send({ error: 'Order not found' });
            }

            // Get customer meta for order count
            const rawData = order.rawData as any;
            let customerMeta = null;

            if (rawData.customer_id && rawData.customer_id > 0) {
                const customer = await prisma.wooCustomer.findUnique({
                    where: { accountId_wooId: { accountId, wooId: rawData.customer_id } },
                    select: { ordersCount: true }
                });
                if (customer) {
                    customerMeta = { ordersCount: customer.ordersCount };
                }
            }

            const { FraudService } = await import('../services/FraudService');
            const result = FraudService.calculateScore({ ...rawData, _customerMeta: customerMeta });

            return result;
        } catch (error) {
            Logger.error('Failed to calculate fraud score', { error });
            return reply.code(500).send({ error: 'Failed to calculate fraud score' });
        }
    });

    // Get Attribution data for an Order
    fastify.get<{ Params: { id: string } }>('/:id/attribution', async (request, reply) => {
        const { id } = orderIdParamSchema.parse(request.params);
        const accountId = request.user?.accountId;

        if (!accountId) {
            return reply.code(400).send({ error: 'accountId header is required' });
        }

        try {
            let order;

            // Try finding by internal UUID first
            order = await prisma.wooOrder.findUnique({ where: { id } });

            // If not found and ID is numeric, try finding by WooID
            if (!order && !isNaN(Number(id))) {
                order = await prisma.wooOrder.findUnique({
                    where: { accountId_wooId: { accountId, wooId: Number(id) } }
                });
            }

            if (!order || order.accountId !== accountId) {
                return reply.code(404).send({ error: 'Order not found' });
            }

            // Find purchase event that matches this order's wooId
            // The purchase event stores orderId in the payload
            const purchaseEvent = await prisma.analyticsEvent.findFirst({
                where: {
                    type: 'purchase',
                    session: { accountId }
                },
                include: {
                    session: {
                        select: {
                            firstTouchSource: true,
                            lastTouchSource: true,
                            utmSource: true,
                            utmMedium: true,
                            utmCampaign: true,
                            referrer: true,
                            country: true,
                            city: true,
                            deviceType: true,
                            browser: true,
                            os: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Filter by orderId in payload (can't do this in Prisma query easily)
            let attribution = null;

            if (purchaseEvent) {
                const payload = purchaseEvent.payload as any;
                // Check if this event matches our order
                if (payload?.orderId === order.wooId || payload?.order_id === order.wooId) {
                    const session = purchaseEvent.session;
                    attribution = {
                        firstTouchSource: session.firstTouchSource || 'direct',
                        lastTouchSource: session.lastTouchSource || 'direct',
                        utmSource: session.utmSource,
                        utmMedium: session.utmMedium,
                        utmCampaign: session.utmCampaign,
                        referrer: session.referrer,
                        country: session.country,
                        city: session.city,
                        deviceType: session.deviceType,
                        browser: session.browser,
                        os: session.os
                    };
                }
            }

            // If no match by payload, try to find by looking at all purchase events
            if (!attribution) {
                const allPurchaseEvents = await prisma.analyticsEvent.findMany({
                    where: {
                        type: 'purchase',
                        session: { accountId }
                    },
                    include: {
                        session: {
                            select: {
                                firstTouchSource: true,
                                lastTouchSource: true,
                                utmSource: true,
                                utmMedium: true,
                                utmCampaign: true,
                                referrer: true,
                                country: true,
                                city: true,
                                deviceType: true,
                                browser: true,
                                os: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 100
                });

                for (const event of allPurchaseEvents) {
                    const payload = event.payload as any;
                    if (payload?.orderId === order.wooId || payload?.order_id === order.wooId) {
                        const session = event.session;
                        attribution = {
                            firstTouchSource: session.firstTouchSource || 'direct',
                            lastTouchSource: session.lastTouchSource || 'direct',
                            utmSource: session.utmSource,
                            utmMedium: session.utmMedium,
                            utmCampaign: session.utmCampaign,
                            referrer: session.referrer,
                            country: session.country,
                            city: session.city,
                            deviceType: session.deviceType,
                            browser: session.browser,
                            os: session.os
                        };
                        break;
                    }
                }
            }

            return { attribution };
        } catch (error) {
            Logger.error('Failed to fetch order attribution', { error });
            return reply.code(500).send({ error: 'Failed to fetch order attribution' });
        }
    });
};

export default ordersRoutes;
