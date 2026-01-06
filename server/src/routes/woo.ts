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

router.post('/configure', async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        const { origin } = req.body; // Client sends its current origin

        if (!accountId) return res.status(400).json({ error: 'No account selected' });
        if (!origin) return res.status(400).json({ error: 'Origin URL is required' });

        const woo = await WooService.forAccount(accountId);

        // Push configuration to the plugin
        // We send the origin as the API URL, and the account ID
        const result = await woo.updatePluginSettings({
            account_id: accountId,
            api_url: origin
        });

        res.json({ success: true, plugin_response: result });
    } catch (error: any) {
        console.error('Woo Configuration Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to configure plugin' });
    }
});

export default router;
