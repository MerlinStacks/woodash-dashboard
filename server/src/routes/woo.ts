import { Router, Request, Response } from 'express';
import { WooService } from '../services/woo';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/orders', async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        if (!accountId) return res.status(400).json({ error: 'No account selected' });

        const woo = await WooService.forAccount(accountId);
        const orders = await woo.getOrders({ per_page: 20 });

        res.json(orders);
    } catch (error: any) {
        console.error('Woo API Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

router.get('/products', async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        if (!accountId) return res.status(400).json({ error: 'No account selected' });

        const woo = await WooService.forAccount(accountId);
        // Pass standard Woo query params (search, page, per_page, etc.)
        const products = await woo.getProducts({
            ...req.query,
            per_page: Number(req.query.per_page) || 20
        });

        res.json(products);
    } catch (error: any) {
        console.error('Woo API Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

export default router;
