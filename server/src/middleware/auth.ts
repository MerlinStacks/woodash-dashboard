
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        accountId: string;
    };
    accountId?: string; // Legacy support for some routes that used req.accountId
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Invalid token format' });
    }

    try {
        const decoded: any = verifyToken(token);
        const accountId = req.headers['x-account-id'] as string;

        if (!accountId) {
            // For strict endpoints, we might demand this. 
            // However, to fix the 400 "No account selected" gracefully, we returning 400 is correct if the route NEEDS it.
            // But let's attach what we have.
            // If the route strictly needs it, it will check req.user.accountId
        }

        req.user = {
            id: decoded.userId,
            accountId: accountId
        };

        // Backwards compatibility for routes expecting req.accountId directly
        req.accountId = accountId;

        if (!accountId && (req.originalUrl.includes('/customers') || req.originalUrl.includes('/products') || req.originalUrl.includes('/marketing'))) {
            // Specific enforce for the reported issues
            return res.status(400).json({ error: 'No account selected' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export const requireSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // TODO: Implement actual super admin check
    next();
};
