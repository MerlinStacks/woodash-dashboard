/**
 * Middleware barrel export
 * 
 * Exports both Express (legacy) and Fastify (native) versions.
 * Fastify versions are suffixed with 'Fastify'.
 */

// Auth middleware - Express and Fastify
export {
    requireAuth,
    requireSuperAdmin,
    requireAuthFastify,
    requireSuperAdminFastify,
    AuthRequest
} from './auth';

// Request logging - Express only (Fastify uses hooks in app.ts)
export { requestLogger } from './requestLogger';

// Request ID - Express only (Fastify uses hooks in app.ts)
export { requestId, getRequestId } from './requestId';

// Tracking utilities - framework-agnostic
export { isValidAccount, isRateLimited } from './trackingMiddleware';

// Validation - Express and Fastify
export { validate, validateFastify } from './validate';
