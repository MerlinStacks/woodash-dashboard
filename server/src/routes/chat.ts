
import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { ChatService } from '../services/ChatService';
import { requireAuth } from '../middleware/auth';

// We need to inject the service or use singleton. 
// For simplicity, we'll attach it to the req or export a setup function.
// Here we'll export a router creator.

export const createChatRouter = (chatService: ChatService) => {
    const router = Router();

    // Middleware to ensure auth
    router.use(requireAuth);

    // GET /api/chat/conversations
    router.get('/conversations', async (req: any, res) => {
        try {
            const { status, assignedTo } = req.query;
            // User must belong to the account
            // const accountId = req.user.accountId... assuming Multi-tenant context 
            // For now using header or query for simplicity in this dev phase, 
            // BUT strict auth usually gets account from header/token.
            // Let's assume req.account.id is populated by middleware or we use a header x-account-id
            const accountId = req.headers['x-account-id'];

            if (!accountId) return res.status(400).json({ error: 'Account ID required' });

            const conversations = await chatService.listConversations(
                String(accountId),
                status as string,
                assignedTo as string
            );
            res.json(conversations);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch conversations' });
        }
    });

    // POST /api/chat/conversations (Start new)
    router.post('/conversations', async (req: any, res) => {
        const { accountId, wooCustomerId, visitorToken } = req.body;
        const conv = await chatService.createConversation(accountId, wooCustomerId, visitorToken);
        res.json(conv);
    });

    // --- Canned Responses ---

    router.get('/canned-responses', async (req: any, res) => {
        const accountId = req.headers['x-account-id'];
        if (!accountId) return res.status(400).json({});

        const responses = await prisma.cannedResponse.findMany({
            where: { accountId: String(accountId) }
        });
        res.json(responses);
    });

    router.post('/canned-responses', async (req: any, res) => {
        const { shortcut, content, accountId } = req.body;
        const resp = await prisma.cannedResponse.create({
            data: { shortcut, content, accountId }
        });
        res.json(resp);
    });

    router.delete('/canned-responses/:id', async (req, res) => {
        await prisma.cannedResponse.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    });

    // --- Settings ---

    router.get('/settings', async (req: any, res) => {
        const accountId = req.headers['x-account-id'];
        if (!accountId) return res.status(400).json({});

        const feature = await prisma.accountFeature.findUnique({
            where: { accountId_featureKey: { accountId: String(accountId), featureKey: 'CHAT_SETTINGS' } }
        });
        res.json(feature?.config || {});
    });

    router.post('/settings', async (req: any, res) => {
        const accountId = req.headers['x-account-id'];
        if (!accountId) return res.status(400).json({});

        const { businessHours, autoReply } = req.body;
        const config = { businessHours, autoReply };

        await prisma.accountFeature.upsert({
            where: { accountId_featureKey: { accountId: String(accountId), featureKey: 'CHAT_SETTINGS' } },
            update: { config, isEnabled: true },
            create: {
                accountId: String(accountId),
                featureKey: 'CHAT_SETTINGS',
                isEnabled: true,
                config
            }
        });
        res.json({ success: true });
    });

    // GET /api/chat/:id
    router.get('/:id', async (req, res) => {
        const conv = await chatService.getConversation(req.params.id);
        if (!conv) return res.status(404).json({ error: 'Not found' });
        res.json(conv);
    });

    // POST /api/chat/:id/messages
    router.post('/:id/messages', async (req: any, res) => {
        const { content, type, isInternal } = req.body;
        // senderId should come from auth token for AGENT
        const userId = req.user?.id;

        const msg = await chatService.addMessage(
            req.params.id,
            content,
            type || 'AGENT', // Default to AGENT if authorized
            userId,
            isInternal
        );
        res.json(msg);
    });

    // PUT /api/chat/:id (Update status/assignee)
    router.put('/:id', async (req, res) => {
        const { status, assignedTo, wooCustomerId } = req.body;
        const { id } = req.params;

        if (status) await chatService.updateStatus(id, status);
        if (assignedTo) await chatService.assignConversation(id, assignedTo);
        if (wooCustomerId) await chatService.linkCustomer(id, wooCustomerId);

        res.json({ success: true });
    });

    // POST /api/chat/:id/merge
    router.post('/:id/merge', async (req, res) => {
        const { sourceId } = req.body;
        await chatService.mergeConversations(req.params.id, sourceId);
        res.json({ success: true });
    });



    return router;
};
