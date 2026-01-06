
import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { InvoiceService } from '../services/InvoiceService';
import { requireAuth } from '../middleware/auth';
import { Logger } from '../utils/logger';

const router = Router();
const invoiceService = new InvoiceService();

router.use(requireAuth);

// Get all templates for account
router.get('/templates', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user?.accountId;
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    try {
        const templates = await invoiceService.getTemplates(accountId);
        res.json(templates);
    } catch (error) {
        Logger.error('Failed to fetch templates', { error });
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Get specific template
router.get('/templates/:id', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user?.accountId;
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    try {
        const template = await invoiceService.getTemplate(req.params.id, accountId);
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

// Create template
router.post('/templates', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user?.accountId;
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    try {
        const template = await invoiceService.createTemplate(accountId, req.body);
        res.json(template);
    } catch (error: any) {
        Logger.error('Failed to create invoice template', { error, accountId, body: req.body });
        // Handle unique constraint violation (Prisma P2002)
        if (error?.code === 'P2002') {
            return res.status(409).json({ error: 'A template with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Update template
router.put('/templates/:id', async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user?.accountId;
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    try {
        const template = await invoiceService.updateTemplate(req.params.id, accountId, req.body);
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update template' });
    }
});

export default router;
