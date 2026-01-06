import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { SearchQueryService } from '../services/search/SearchQueryService';
import { requireAuth } from '../middleware/auth';
import { Logger } from '../utils/logger';

const router = Router();

router.use(requireAuth);

router.get('/global', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = req.accountId;
        const { q } = req.query;

        if (!accountId) return res.status(400).json({ error: 'No account' });

        const results = await SearchQueryService.globalSearch(accountId, q as string);
        res.json(results);
    } catch (error) {
        Logger.error('Search failed', { error });
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;
