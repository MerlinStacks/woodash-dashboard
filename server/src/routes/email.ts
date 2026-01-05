import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../services/EmailService';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const emailService = new EmailService();

router.use(requireAuth);

// List Accounts
router.get('/accounts', async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user?.accountId || (req as any).accountId;
        if (!accountId) return res.status(400).json({ error: 'No account selected' });

        const accounts = await prisma.emailAccount.findMany({
            where: { accountId }
        });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list email accounts' });
    }
});

// Create Account
router.post('/accounts', async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user?.accountId || (req as any).accountId;
        if (!accountId) return res.status(400).json({ error: 'No account selected' });

        const { name, email, host, port, username, password, type, isSecure } = req.body;

        // Basic validation
        if (!host || !port || !username || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const account = await prisma.emailAccount.create({
            data: {
                accountId,
                name,
                email,
                host,
                port: parseInt(port),
                username,
                password, // TODO: Encryption
                type,
                isSecure: Boolean(isSecure)
            }
        });

        res.json(account);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create email account' });
    }
});

// Update Account
router.put('/accounts/:id', async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user?.accountId || (req as any).accountId;
        const { id } = req.params;
        const data = req.body;

        // Security check: ensure belongs to user's account
        const existing = await prisma.emailAccount.findFirst({
            where: { id, accountId }
        });

        if (!existing) return res.status(404).json({ error: 'Account not found' });

        const updated = await prisma.emailAccount.update({
            where: { id },
            data: {
                ...data,
                port: data.port ? parseInt(data.port) : undefined,
                updatedAt: new Date()
            }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update email account' });
    }
});

// Delete Account
router.delete('/accounts/:id', async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user?.accountId || (req as any).accountId;
        const { id } = req.params;
        const result = await prisma.emailAccount.deleteMany({
            where: { id, accountId }
        });

        if (result.count === 0) return res.status(404).json({ error: 'Account not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// Test Connection
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { host, port, username, password, type, isSecure } = req.body;

        // Mock object for validation
        const mockAccount: any = {
            host,
            port: parseInt(port),
            username,
            password,
            type,
            isSecure: Boolean(isSecure)
        };

        const success = await emailService.verifyConnection(mockAccount);
        res.json({ success });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
