import { Router, Request, Response } from 'express';
import { SearchQueryService } from '../services/search/SearchQueryService';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/global', async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        const { q } = req.query;

        if (!accountId) return res.status(400).json({ error: 'No account' });

        const results = await SearchQueryService.globalSearch(accountId, q as string);
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;
