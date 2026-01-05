import { Router } from 'express';
import { esClient } from '../utils/elastic';

const router = Router();

router.get('/count', async (req, res) => {
    try {
        const result = await esClient.count({
            index: 'customers'
        });
        res.json({ count: result.count });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
