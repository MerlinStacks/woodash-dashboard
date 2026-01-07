import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';

const router = Router();

router.use(requireAuth);

// Get all policies for account
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user?.accountId;
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    try {
        const policies = await prisma.policy.findMany({
            where: { accountId },
            orderBy: [{ type: 'asc' }, { title: 'asc' }]
        });
        res.json(policies);
    } catch (error) {
        Logger.error('Failed to fetch policies', { error, accountId });
        res.status(500).json({ error: 'Failed to fetch policies' });
    }
});

// Get single policy
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user?.accountId;
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    try {
        const policy = await prisma.policy.findFirst({
            where: { id: req.params.id, accountId }
        });
        if (!policy) return res.status(404).json({ error: 'Policy not found' });
        res.json(policy);
    } catch (error) {
        Logger.error('Failed to fetch policy', { error, accountId, id: req.params.id });
        res.status(500).json({ error: 'Failed to fetch policy' });
    }
});

// Create policy
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user?.accountId;
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    const { title, content, type, category, isPublished } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    try {
        const policy = await prisma.policy.create({
            data: {
                accountId,
                title,
                content: content || '',
                type: type || 'POLICY',
                category: category || null,
                isPublished: isPublished !== undefined ? isPublished : true
            }
        });
        res.json(policy);
    } catch (error) {
        Logger.error('Failed to create policy', { error, accountId, body: req.body });
        res.status(500).json({ error: 'Failed to create policy' });
    }
});

// Update policy
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user?.accountId;
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    const { title, content, type, category, isPublished } = req.body;

    try {
        // Verify policy exists and belongs to account
        const existing = await prisma.policy.findFirst({
            where: { id: req.params.id, accountId }
        });
        if (!existing) return res.status(404).json({ error: 'Policy not found' });

        const policy = await prisma.policy.update({
            where: { id: req.params.id },
            data: {
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
                ...(type !== undefined && { type }),
                ...(category !== undefined && { category }),
                ...(isPublished !== undefined && { isPublished })
            }
        });
        res.json(policy);
    } catch (error) {
        Logger.error('Failed to update policy', { error, accountId, id: req.params.id });
        res.status(500).json({ error: 'Failed to update policy' });
    }
});

// Delete policy
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user?.accountId;
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    try {
        // Verify policy exists and belongs to account
        const existing = await prisma.policy.findFirst({
            where: { id: req.params.id, accountId }
        });
        if (!existing) return res.status(404).json({ error: 'Policy not found' });

        await prisma.policy.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    } catch (error) {
        Logger.error('Failed to delete policy', { error, accountId, id: req.params.id });
        res.status(500).json({ error: 'Failed to delete policy' });
    }
});

export default router;
