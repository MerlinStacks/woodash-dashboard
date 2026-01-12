/**
 * Dashboard Route - Fastify Plugin
 */

import { FastifyPluginAsync } from 'fastify';
import { requireAuthFastify } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';
import { AdsTools } from '../services/tools/AdsTools';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', requireAuthFastify);

    // GET /api/dashboard/inbox-count
    fastify.get('/inbox-count', async (request, reply) => {
        const accountId = request.accountId;
        if (!accountId) return reply.code(400).send({ error: 'No account' });

        try {
            const openCount = await prisma.conversation.count({
                where: { accountId, status: 'OPEN' }
            });
            return { open: openCount };
        } catch (error) {
            Logger.error('Failed to fetch inbox count', { error, accountId });
            return reply.code(500).send({ error: 'Failed to fetch inbox count' });
        }
    });

    // GET /api/dashboard/ad-suggestions
    fastify.get<{ Querystring: { refresh?: string } }>('/ad-suggestions', async (request, reply) => {
        const accountId = request.accountId;
        if (!accountId) return reply.code(400).send({ error: 'No account' });

        try {
            // Fetch saved context to pass to optimizer
            const savedContext = await prisma.adSuggestionContext.findUnique({
                where: { accountId },
                select: { context: true }
            });

            const result = await AdsTools.getAdOptimizationSuggestions(accountId, {
                userContext: savedContext?.context,
                includeInventory: true
            });

            if (typeof result === 'string') {
                return {
                    suggestions: [],
                    action_items: [],
                    message: result
                };
            }

            return result;
        } catch (error) {
            Logger.error('Failed to fetch ad suggestions', { error, accountId });
            return reply.code(500).send({ error: 'Failed to fetch ad suggestions' });
        }
    });

    // GET /api/dashboard/ad-suggestions/context
    fastify.get('/ad-suggestions/context', async (request, reply) => {
        const accountId = request.accountId;
        if (!accountId) return reply.code(400).send({ error: 'No account' });

        try {
            const context = await prisma.adSuggestionContext.findUnique({
                where: { accountId },
                select: { context: true, updatedAt: true }
            });

            return { context: context?.context || '', updatedAt: context?.updatedAt || null };
        } catch (error) {
            Logger.error('Failed to fetch ad suggestion context', { error, accountId });
            return reply.code(500).send({ error: 'Failed to fetch context' });
        }
    });

    // POST /api/dashboard/ad-suggestions/context
    fastify.post<{ Body: { context: string } }>('/ad-suggestions/context', async (request, reply) => {
        const accountId = request.accountId;
        if (!accountId) return reply.code(400).send({ error: 'No account' });

        try {
            const { context } = request.body;

            if (typeof context !== 'string') {
                return reply.code(400).send({ error: 'Context must be a string' });
            }

            // Upsert the context
            const saved = await prisma.adSuggestionContext.upsert({
                where: { accountId },
                update: { context },
                create: { accountId, context }
            });

            Logger.info('Ad suggestion context updated', { accountId, contextLength: context.length });

            return { success: true, updatedAt: saved.updatedAt };
        } catch (error) {
            Logger.error('Failed to save ad suggestion context', { error, accountId });
            return reply.code(500).send({ error: 'Failed to save context' });
        }
    });


    // GET Layout
    fastify.get('/', async (request, reply) => {
        const accountId = request.accountId;
        if (!accountId) return reply.code(400).send({ error: 'No account' });

        let layout = await prisma.dashboardLayout.findFirst({
            where: { accountId, userId: request.user?.id },
            include: { widgets: { orderBy: { sortOrder: 'asc' } } }
        });

        if (!layout) {
            layout = await prisma.dashboardLayout.create({
                data: {
                    accountId,
                    userId: request.user?.id!,
                    name: 'Main Dashboard',
                    isDefault: true,
                    widgets: {
                        create: [
                            { widgetKey: 'total-sales', position: { x: 0, y: 0, w: 4, h: 4 }, sortOrder: 0 },
                            { widgetKey: 'recent-orders', position: { x: 4, y: 0, w: 4, h: 4 }, sortOrder: 1 },
                            { widgetKey: 'marketing-roas', position: { x: 8, y: 0, w: 4, h: 4 }, sortOrder: 2 },
                            { widgetKey: 'sales-chart', position: { x: 0, y: 4, w: 8, h: 6 }, sortOrder: 3 },
                            { widgetKey: 'top-products', position: { x: 8, y: 4, w: 4, h: 6 }, sortOrder: 4 },
                            { widgetKey: 'customer-growth', position: { x: 0, y: 10, w: 6, h: 6 }, sortOrder: 5 }
                        ]
                    }
                },
                include: { widgets: { orderBy: { sortOrder: 'asc' } } }
            });
        }

        return layout;
    });

    // SAVE Layout (Widgets Update)
    fastify.post<{ Body: { widgets: Array<{ widgetKey: string; position: any; settings?: any }> } }>('/', async (request, reply) => {
        const accountId = request.accountId;
        if (!accountId) return reply.code(400).send({ error: 'No account' });

        const layout = await prisma.dashboardLayout.findFirst({
            where: { accountId, userId: request.user?.id }
        });

        if (!layout) return reply.code(404).send({ error: 'Dashboard not found' });

        const { widgets } = request.body;

        await prisma.$transaction([
            prisma.dashboardWidget.deleteMany({ where: { dashboardId: layout.id } }),
            prisma.dashboardWidget.createMany({
                data: widgets.map((w, index) => ({
                    dashboardId: layout.id,
                    widgetKey: w.widgetKey,
                    position: w.position,
                    settings: w.settings || {},
                    sortOrder: index
                }))
            })
        ]);

        const updated = await prisma.dashboardLayout.findUnique({
            where: { id: layout.id },
            include: { widgets: { orderBy: { sortOrder: 'asc' } } }
        });

        return updated;
    });
};

export default dashboardRoutes;
