import { Router, Request, Response } from 'express';
import { ProductsService } from '../services/products';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        // Middleware guarantees accountId or returns 400

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const query = (req.query.q as string) || '';

        const result = await ProductsService.searchProducts(accountId, query, page, limit);
        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /:id (Get single product by WooID)
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).accountId;

        const wooId = parseInt(req.params.id);
        if (isNaN(wooId)) return res.status(400).json({ error: 'Invalid product ID' });

        const product = await ProductsService.getProductByWooId(accountId, wooId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        res.json(product);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// PATCH /:id (Update product details)
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).accountId;

        const wooId = parseInt(req.params.id);
        if (isNaN(wooId)) return res.status(400).json({ error: 'Invalid product ID' });

        const { binLocation, name, stockStatus, isGoldPriceApplied } = req.body;

        const product = await ProductsService.updateProduct(accountId, wooId, { binLocation, name, stockStatus, isGoldPriceApplied });
        res.json(product);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

export default router;
