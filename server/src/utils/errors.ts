/**
 * Custom Error Classes for Overseek
 * 
 * Structured error handling with context for better debugging and user feedback.
 */

// ============================================================================
// Base Error
// ============================================================================

export class OverseekError extends Error {
    /** HTTP status code */
    readonly statusCode: number;
    /** Error code for client handling */
    readonly code: string;
    /** Additional context for debugging */
    readonly context?: Record<string, unknown>;
    /** Whether this error is recoverable */
    readonly isRecoverable: boolean;

    constructor(
        message: string,
        options: {
            statusCode?: number;
            code?: string;
            context?: Record<string, unknown>;
            isRecoverable?: boolean;
            cause?: Error;
        } = {}
    ) {
        super(message, { cause: options.cause });
        this.name = 'OverseekError';
        this.statusCode = options.statusCode ?? 500;
        this.code = options.code ?? 'INTERNAL_ERROR';
        this.context = options.context;
        this.isRecoverable = options.isRecoverable ?? false;
    }

    /** Convert to JSON for API responses */
    toJSON() {
        return {
            error: this.message,
            code: this.code,
            ...(process.env.NODE_ENV !== 'production' && this.context ? { context: this.context } : {}),
        };
    }
}

// ============================================================================
// AI Service Errors
// ============================================================================

export class AIServiceError extends OverseekError {
    constructor(
        message: string,
        options: {
            code?: string;
            context?: Record<string, unknown>;
            isRecoverable?: boolean;
            cause?: Error;
        } = {}
    ) {
        super(message, {
            statusCode: 503,
            code: options.code ?? 'AI_SERVICE_ERROR',
            ...options,
        });
        this.name = 'AIServiceError';
    }
}

export class AIRateLimitError extends AIServiceError {
    constructor(retryAfterSeconds?: number) {
        super('AI service is temporarily unavailable. Please try again in a moment.', {
            code: 'AI_RATE_LIMITED',
            isRecoverable: true,
            context: retryAfterSeconds ? { retryAfterSeconds } : undefined,
        });
        this.name = 'AIRateLimitError';
    }
}

export class AIConfigurationError extends AIServiceError {
    constructor(reason: string) {
        super(`AI service is not configured: ${reason}`, {
            code: 'AI_NOT_CONFIGURED',
            isRecoverable: false,
        });
        this.name = 'AIConfigurationError';
    }
}

// ============================================================================
// External API Errors
// ============================================================================

export class ExternalAPIError extends OverseekError {
    constructor(
        service: string,
        message: string,
        options: {
            statusCode?: number;
            context?: Record<string, unknown>;
            cause?: Error;
        } = {}
    ) {
        super(`${service}: ${message}`, {
            statusCode: options.statusCode ?? 502,
            code: 'EXTERNAL_API_ERROR',
            isRecoverable: true,
            ...options,
        });
        this.name = 'ExternalAPIError';
    }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class ValidationError extends OverseekError {
    constructor(
        message: string,
        options: {
            field?: string;
            context?: Record<string, unknown>;
        } = {}
    ) {
        super(message, {
            statusCode: 400,
            code: 'VALIDATION_ERROR',
            isRecoverable: true,
            context: options.field ? { field: options.field, ...options.context } : options.context,
        });
        this.name = 'ValidationError';
    }
}

// ============================================================================
// Resource Errors
// ============================================================================

export class NotFoundError extends OverseekError {
    constructor(resource: string, id?: string | number) {
        super(id ? `${resource} with ID '${id}' not found` : `${resource} not found`, {
            statusCode: 404,
            code: 'NOT_FOUND',
            isRecoverable: false,
            context: { resource, id },
        });
        this.name = 'NotFoundError';
    }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isOverseekError(error: unknown): error is OverseekError {
    return error instanceof OverseekError;
}
