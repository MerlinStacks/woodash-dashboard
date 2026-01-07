import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';
import { AdsTools } from '../services/tools/AdsTools';

const router = Router();

router.use(requireAuth);

/**
 * GET /api/dashboard/inbox-count
 * Returns the count of open inbox conversations for the account.
 */
router.get('/inbox-count', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = (req as any).accountId;
    if (!accountId) return res.status(400).json({ error: 'No account' });

    try {
        const openCount = await prisma.conversation.count({
            where: { accountId, status: 'OPEN' }
        });
        res.json({ open: openCount });
    } catch (error) {
        Logger.error('Failed to fetch inbox count', { error, accountId });
        res.status(500).json({ error: 'Failed to fetch inbox count' });
    }
});

/**
 * GET /api/dashboard/ad-suggestions
 * Returns AI-powered optimization suggestions for ad campaigns.
 */
router.get('/ad-suggestions', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = (req as any).accountId;
    if (!accountId) return res.status(400).json({ error: 'No account' });

    try {
        const result = await AdsTools.getAdOptimizationSuggestions(accountId);

        // Handle string response (error message or no accounts)
        if (typeof result === 'string') {
            return res.json({
                suggestions: [],
                action_items: [],
                message: result
            });
        }

        res.json(result);
    } catch (error) {
        Logger.error('Failed to fetch ad suggestions', { error, accountId });
        res.status(500).json({ error: 'Failed to fetch ad suggestions' });
    }
});

// GET Layout
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = (req as any).accountId;
    if (!accountId) return res.status(400).json({ error: 'No account' });

    // For now, simple logic: Get the First dashboard for this account/user combo, or create default.
    let layout = await prisma.dashboardLayout.findFirst({
        where: { accountId, userId: (req as any).user.id },
        include: { widgets: { orderBy: { sortOrder: 'asc' } } }
    });

    if (!layout) {
        // Create Default
        layout = await prisma.dashboardLayout.create({
            data: {
                accountId,
                userId: (req as any).user.id,
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

    res.json(layout);
});

// SAVE Layout (Widgets Update)
// Expects: { widgets: [{ id?, widgetKey, position, settings }] }
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = (req as any).accountId;
    if (!accountId) return res.status(400).json({ error: 'No account' });

    // Find ID
    const layout = await prisma.dashboardLayout.findFirst({
        where: { accountId, userId: (req as any).user.id }
    });

    if (!layout) return res.status(404).json({ error: 'Dashboard not found' });

    const { widgets } = req.body;

    // Transaction: Delete existing and re-create? Or Upsert?
    // Delete/Re-create is easiest for complete layout sync.
    // CAUTION: Losing custom settings if we just delete?
    // Better: Upsert by ID if provided, delete missing.

    // MVP: Delete all widgets for this dashboard and insert new ones (safest/easiest synchronization)
    await prisma.$transaction([
        prisma.dashboardWidget.deleteMany({ where: { dashboardId: layout.id } }),
        prisma.dashboardWidget.createMany({
            data: widgets.map((w: any, index: number) => ({
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

    res.json(updated);
});

export default router;
