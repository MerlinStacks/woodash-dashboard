import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = Router();

router.use(requireAuth);

router.get('/models', async (req: Request, res: Response) => {
    try {
        const accountId = req.headers['x-account-id'] as string;
        let apiKey = '';

        if (accountId) {
            const account = await prisma.account.findUnique({
                where: { id: accountId },
                select: { openRouterApiKey: true }
            });
            if (account && account.openRouterApiKey) {
                apiKey = account.openRouterApiKey;
            }
        }

        const models = await AIService.getModels(apiKey);
        res.json(models);
    } catch (error) {
        console.error('Models Error:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        const accountId = req.headers['x-account-id'] as string;

        if (!message) return res.status(400).json({ error: 'Message required' });
        if (!accountId) return res.status(400).json({ error: 'Account ID required header' });

        const response = await AIService.generateResponse(message, accountId);
        res.json(response);

    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

export default router;
