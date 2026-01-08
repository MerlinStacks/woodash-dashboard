import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';

const router = Router();

router.use(requireAuth);

/**
 * GET /api/todos
 * Returns all todos for the current user in the current account.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = (req as any).accountId;
    const userId = (req as any).user.id;

    if (!accountId) return res.status(400).json({ error: 'No account' });

    try {
        const todos = await prisma.todo.findMany({
            where: { accountId, userId },
            orderBy: [
                { completed: 'asc' },
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        res.json(todos);
    } catch (error) {
        Logger.error('Failed to fetch todos', { error, accountId, userId });
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

/**
 * POST /api/todos
 * Create a new todo.
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = (req as any).accountId;
    const userId = (req as any).user.id;
    const { title, priority, dueDate, aiGenerated } = req.body;

    if (!accountId) return res.status(400).json({ error: 'No account' });
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

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
        res.status(201).json(todo);
    } catch (error) {
        Logger.error('Failed to create todo', { error, accountId, userId });
        res.status(500).json({ error: 'Failed to create todo' });
    }
});

/**
 * PUT /api/todos/:id
 * Update a todo (toggle complete, edit title, etc.)
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = (req as any).accountId;
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { title, completed, priority, dueDate } = req.body;

    if (!accountId) return res.status(400).json({ error: 'No account' });

    try {
        // Verify ownership
        const existing = await prisma.todo.findFirst({
            where: { id, accountId, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Todo not found' });
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
        res.json(todo);
    } catch (error) {
        Logger.error('Failed to update todo', { error, accountId, userId, id });
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

/**
 * DELETE /api/todos/:id
 * Delete a todo.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = (req as any).accountId;
    const userId = (req as any).user.id;
    const { id } = req.params;

    if (!accountId) return res.status(400).json({ error: 'No account' });

    try {
        // Verify ownership
        const existing = await prisma.todo.findFirst({
            where: { id, accountId, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        await prisma.todo.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        Logger.error('Failed to delete todo', { error, accountId, userId, id });
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

/**
 * POST /api/todos/suggest
 * Generate AI task suggestions based on store activity.
 */
router.post('/suggest', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = (req as any).accountId;
    const userId = (req as any).user.id;

    if (!accountId) return res.status(400).json({ error: 'No account' });

    try {
        // Get account settings for AI
        const account = await prisma.account.findUnique({
            where: { id: accountId },
            select: { openRouterApiKey: true, aiModel: true }
        });

        // Get recent activity to inform suggestions
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

        // Generate suggestions based on activity
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

        // Add general business suggestions
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 1) { // Monday
            suggestions.push({ title: 'Review last week\'s sales performance', priority: 'LOW' });
        }
        if (dayOfWeek === 5) { // Friday
            suggestions.push({ title: 'Prepare weekend marketing campaigns', priority: 'NORMAL' });
        }

        // Add fallback if no specific suggestions
        if (suggestions.length === 0) {
            suggestions.push(
                { title: 'Review product descriptions for SEO improvements', priority: 'LOW' },
                { title: 'Check customer reviews and respond if needed', priority: 'NORMAL' }
            );
        }

        res.json({ suggestions });
    } catch (error) {
        Logger.error('Failed to generate todo suggestions', { error, accountId, userId });
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

export default router;
