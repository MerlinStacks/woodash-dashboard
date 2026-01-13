/**
 * Todo Route - Fastify Plugin
 */

import { FastifyPluginAsync } from 'fastify';
import { requireAuthFastify } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';

interface TodoBody {
    title?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
    dueDate?: string | null;
    completed?: boolean;
    aiGenerated?: boolean;
}

const todoRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', requireAuthFastify);

    // GET /api/todos
    fastify.get('/', async (request, reply) => {
        const accountId = request.accountId;
        const userId = request.user?.id;

        if (!accountId) return reply.code(400).send({ error: 'No account' });

        try {
            const todos = await prisma.todo.findMany({
                where: { accountId, userId },
                orderBy: [
                    { completed: 'asc' },
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
            return todos;
        } catch (error) {
            Logger.error('Failed to fetch todos', { error, accountId, userId });
            return reply.code(500).send({ error: 'Failed to fetch todos' });
        }
    });

    // POST /api/todos
    fastify.post<{ Body: TodoBody }>('/', async (request, reply) => {
        const accountId = request.accountId;
        const userId = request.user?.id ?? '';
        const { title, priority, dueDate, aiGenerated } = request.body;

        if (!accountId) return reply.code(400).send({ error: 'No account' });
        if (!title?.trim()) return reply.code(400).send({ error: 'Title is required' });

        try {
            const todo = await prisma.todo.create({
                data: {
                    accountId,
                    userId,
                    title: title.trim(),
                    priority: priority || 'NORMAL',
                    dueDate: dueDate ? new Date(dueDate) : null,
                    aiGenerated: aiGenerated || false
                }
            });
            return reply.code(201).send(todo);
        } catch (error) {
            Logger.error('Failed to create todo', { error, accountId, userId });
            return reply.code(500).send({ error: 'Failed to create todo' });
        }
    });

    // PUT /api/todos/:id
    fastify.put<{ Params: { id: string }; Body: TodoBody }>('/:id', async (request, reply) => {
        const accountId = request.accountId;
        const userId = request.user?.id ?? '';
        const { id } = request.params;
        const { title, completed, priority, dueDate } = request.body;

        if (!accountId) return reply.code(400).send({ error: 'No account' });

        try {
            const existing = await prisma.todo.findFirst({
                where: { id, accountId, userId }
            });

            if (!existing) {
                return reply.code(404).send({ error: 'Todo not found' });
            }

            const todo = await prisma.todo.update({
                where: { id },
                data: {
                    ...(title !== undefined && { title: title.trim() }),
                    ...(completed !== undefined && { completed }),
                    ...(priority !== undefined && { priority }),
                    ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
                }
            });
            return todo;
        } catch (error) {
            Logger.error('Failed to update todo', { error, accountId, userId, id });
            return reply.code(500).send({ error: 'Failed to update todo' });
        }
    });

    // DELETE /api/todos/:id
    fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        const accountId = request.accountId;
        const userId = request.user?.id ?? '';
        const { id } = request.params;

        if (!accountId) return reply.code(400).send({ error: 'No account' });

        try {
            const existing = await prisma.todo.findFirst({
                where: { id, accountId, userId }
            });

            if (!existing) {
                return reply.code(404).send({ error: 'Todo not found' });
            }

            await prisma.todo.delete({ where: { id } });
            return { success: true };
        } catch (error) {
            Logger.error('Failed to delete todo', { error, accountId, userId, id });
            return reply.code(500).send({ error: 'Failed to delete todo' });
        }
    });

    // POST /api/todos/suggest
    fastify.post('/suggest', async (request, reply) => {
        const accountId = request.accountId;
        const userId = request.user?.id;

        if (!accountId) return reply.code(400).send({ error: 'No account' });

        try {
            const [recentOrders, lowStockProducts, openConversations] = await Promise.all([
                prisma.wooOrder.count({
                    where: { accountId, status: 'processing' }
                }),
                prisma.wooProduct.count({
                    where: { accountId, stockStatus: 'outofstock' }
                }),
                prisma.conversation.count({
                    where: { accountId, status: 'OPEN' }
                })
            ]);

            const suggestions: { title: string; priority: string }[] = [];

            if (recentOrders > 0) {
                suggestions.push({
                    title: `Review ${recentOrders} order${recentOrders > 1 ? 's' : ''} pending fulfillment`,
                    priority: recentOrders > 5 ? 'HIGH' : 'NORMAL'
                });
            }

            if (lowStockProducts > 0) {
                suggestions.push({
                    title: `Check ${lowStockProducts} out-of-stock product${lowStockProducts > 1 ? 's' : ''}`,
                    priority: 'HIGH'
                });
            }

            if (openConversations > 0) {
                suggestions.push({
                    title: `Respond to ${openConversations} open conversation${openConversations > 1 ? 's' : ''}`,
                    priority: openConversations > 3 ? 'HIGH' : 'NORMAL'
                });
            }

            const dayOfWeek = new Date().getDay();
            if (dayOfWeek === 1) {
                suggestions.push({ title: 'Review last week\'s sales performance', priority: 'LOW' });
            }
            if (dayOfWeek === 5) {
                suggestions.push({ title: 'Prepare weekend marketing campaigns', priority: 'NORMAL' });
            }

            if (suggestions.length === 0) {
                suggestions.push(
                    { title: 'Review product descriptions for SEO improvements', priority: 'LOW' },
                    { title: 'Check customer reviews and respond if needed', priority: 'NORMAL' }
                );
            }

            return { suggestions };
        } catch (error) {
            Logger.error('Failed to generate todo suggestions', { error, accountId, userId });
            return reply.code(500).send({ error: 'Failed to generate suggestions' });
        }
    });
};

export default todoRoutes;
