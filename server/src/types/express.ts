import { Request } from 'express';

/**
 * Represents the authenticated user attached to the request by the auth middleware.
 */
export interface AuthenticatedUser {
    id: string;
    email: string;
    fullName?: string;
    accountId: string;
    isSuperAdmin?: boolean;
}

/**
 * Extended Request type that includes authenticated user and account information.
 * Use this instead of `(req as any)` in route handlers.
 */
export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
    accountId?: string;
}
