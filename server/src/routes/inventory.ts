import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// --- Suppliers ---

// GET /suppliers
router.get('/suppliers', async (req: Request, res: Response) => {
    const accountId = (req as any).accountId;
    if (!accountId) return res.status(400).json({ error: 'No account' });

    try {
        const suppliers = await prisma.supplier.findMany({
            where: { accountId },
            include: { items: true },
            orderBy: { name: 'asc' }
        });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});

// POST /suppliers
router.post('/suppliers', async (req: Request, res: Response) => {
    const accountId = (req as any).accountId;
    if (!accountId) return res.status(400).json({ error: 'No account' });

    try {
        const { name, contactName, email, phone, currency, leadTimeDefault, leadTimeMin, leadTimeMax, paymentTerms } = req.body;
        const supplier = await prisma.supplier.create({
            data: {
                accountId,
                name,
                contactName,
                email,
                phone,
                currency: currency || 'USD',
                leadTimeDefault: leadTimeDefault ? parseInt(leadTimeDefault) : null,
                leadTimeMin: leadTimeMin ? parseInt(leadTimeMin) : null,
                leadTimeMax: leadTimeMax ? parseInt(leadTimeMax) : null,
                paymentTerms
            }
        });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

// POST /suppliers/:id/items
router.post('/suppliers/:id/items', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { name, sku, cost, leadTime, moq } = req.body;
        const item = await prisma.supplierItem.create({
            data: {
                supplierId: id,
                name,
                sku,
                cost: parseFloat(cost),
                leadTime: leadTime ? parseInt(leadTime) : null,
                moq: moq ? parseInt(moq) : 1
            }
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// --- BOM ---

// GET /products/:productId/bom
router.get('/products/:productId/bom', async (req: Request, res: Response) => {
    const { productId } = req.params;
    try {
        const bom = await prisma.bOM.findUnique({
            where: { productId },
            include: {
                items: {
                    include: { supplierItem: { include: { supplier: true } } }
                }
            }
        });
        res.json(bom || { items: [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch BOM' });
    }
});

// POST /products/:productId/bom
router.post('/products/:productId/bom', async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { items } = req.body; // Array of { supplierItemId, quantity, wasteFactor }

    try {
        // Upsert BOM
        const bom = await prisma.bOM.upsert({
            where: { productId },
            create: { productId },
            update: {}
        });

        // Replace items (Transaction)
        await prisma.$transaction([
            prisma.bOMItem.deleteMany({ where: { bomId: bom.id } }),
            prisma.bOMItem.createMany({
                data: items.map((item: any) => ({
                    bomId: bom.id,
                    supplierItemId: item.supplierItemId,
                    quantity: item.quantity,
                    wasteFactor: item.wasteFactor || 0
                }))
            })
        ]);

        const updated = await prisma.bOM.findUnique({
            where: { id: bom.id },
            include: { items: { include: { supplierItem: true } } }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save BOM' });
    }
});

export default router;
