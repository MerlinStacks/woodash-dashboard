import { Router, Request, Response } from 'express';
import { CustomersService } from '../services/customers';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).accountId;
        // Middleware guarantees accountId or returns 400

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const query = (req.query.q as string) || '';

        const result = await CustomersService.searchCustomers(accountId, query, page, limit);
        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    // PROBE: DEBUG server reload status
    if (req.params.id === '22802' || req.params.id === '5713') {
        console.log('HIT PROBE FOR 22802/5713');
        return res.json({
            id: req.params.id,
            firstName: 'DEBUG_PROBE_HIT',
            lastName: 'SERVER_IS_UPDATED',
            email: 'probe@test.com',
            totalSpent: 0,
            ordersCount: 0,
            dateCreated: new Date(),
            activity: [],
            orders: [],
            automations: []
        });
    }

    try {
        console.log(`[Route] GET /customers/${req.params.id} requested by Account: ${(req as any).accountId}`);
        const accountId = (req as any).accountId;
        const customerId = req.params.id;

        const result = await CustomersService.getCustomerDetails(accountId, customerId);

        if (!result) {
            console.log(`[Route] Customer ${req.params.id} not found by Service.`);
            res.status(404).json({ error: 'Customer not found' });
            return;
        }

        res.json(result);
    } catch (error: any) {
        console.error('Get Customer Details Error:', error);
        res.status(500).json({ error: 'Failed to fetch customer details' });
    }
});

export default router;
