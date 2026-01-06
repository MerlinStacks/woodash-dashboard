
import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { requireAuth } from '../middleware/auth';
import { segmentService } from '../services/SegmentService';
import { Logger } from '../utils/logger';

const router = Router();

// List Segments
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = req.accountId!;
        const segments = await segmentService.listSegments(accountId);
        res.json(segments);
    } catch (error) {
        Logger.error('Error', { error });
        res.status(500).json({ error: 'Failed to list segments' });
    }
});

// Create Segment
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = req.accountId!;
        const segment = await segmentService.createSegment(accountId, req.body);
        res.json(segment);
    } catch (error) {
        Logger.error('Error', { error });
        res.status(500).json({ error: 'Failed to create segment' });
    }
});

// Get Segment
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = req.accountId!;
        const segment = await segmentService.getSegment(req.params.id, accountId);
        if (!segment) return res.status(404).json({ error: 'Segment not found' });
        res.json(segment);
    } catch (error) {
        Logger.error('Error', { error });
        res.status(500).json({ error: 'Failed to get segment' });
    }
});

// Update Segment
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = req.accountId!;
        await segmentService.updateSegment(req.params.id, accountId, req.body);
        res.json({ success: true });
    } catch (error) {
        Logger.error('Error', { error });
        res.status(500).json({ error: 'Failed to update segment' });
    }
});

// Delete Segment
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = req.accountId!;
        await segmentService.deleteSegment(req.params.id, accountId);
        res.json({ success: true });
    } catch (error) {
        Logger.error('Error', { error });
        res.status(500).json({ error: 'Failed to delete segment' });
    }
});

// Preview Customers in Segment
router.get('/:id/preview', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = req.accountId!;
        const customers = await segmentService.previewCustomers(accountId, req.params.id);
        res.json(customers);
    } catch (error) {
        Logger.error('Error', { error });
        res.status(500).json({ error: 'Failed to preview segment' });
    }
});

export default router;
