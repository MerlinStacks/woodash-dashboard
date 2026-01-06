import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { AccountController } from '../controllers/AccountController';
import { AccountUserController } from '../controllers/AccountUserController';
import { OrderTaggingService } from '../services/OrderTaggingService';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

router.use(requireAuth);

// Account Management
router.post('/', AccountController.create);
router.get('/', AccountController.getAll);
router.put('/:accountId', AccountController.update);
router.delete('/:accountId', AccountController.delete);

// User Management
router.get('/:accountId/users', AccountUserController.listUsers);
router.post('/:accountId/users', AccountUserController.addUser);
router.delete('/:accountId/users/:targetUserId', AccountUserController.removeUser);

// Tag Mappings
router.get('/:accountId/tag-mappings', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const mappings = await OrderTaggingService.getTagMappings(req.params.accountId);
        res.json({ mappings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get tag mappings' });
    }
});

router.put('/:accountId/tag-mappings', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { mappings } = req.body;
        if (!Array.isArray(mappings)) {
            return res.status(400).json({ error: 'mappings must be an array' });
        }
        await OrderTaggingService.saveTagMappings(req.params.accountId, mappings);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save tag mappings' });
    }
});

// Get available product tags for mapping
router.get('/:accountId/product-tags', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tags = await OrderTaggingService.getAllProductTags(req.params.accountId);
        res.json({ tags });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get product tags' });
    }
});

export default router;
