/**
 * Environment Validation
 * 
 * Validates required environment variables at startup.
 * Fails fast if critical configuration is missing.
 */

import { Logger } from './logger';

interface EnvConfig {
    /** Variable name */
    name: string;
    /** Is this variable required? */
    required: boolean;
    /** Default value if not required and missing */
    default?: string;
}

const ENV_CONFIG: EnvConfig[] = [
    // Critical - server won't function without these
    { name: 'DATABASE_URL', required: true },
    { name: 'JWT_SECRET', required: true },
    { name: 'REDIS_HOST', required: false, default: 'localhost' },
    { name: 'REDIS_PORT', required: false, default: '6379' },

    // Elasticsearch
    { name: 'ELASTICSEARCH_NODE', required: false, default: 'http://localhost:9200' },

    // Optional integrations
    { name: 'ENCRYPTION_KEY', required: false },
    { name: 'GOLD_API_KEY', required: false },
];

/**
 * Validates environment variables and logs warnings/errors.
 * Throws if required variables are missing.
 */
export function validateEnvironment(): void {
    const missing: string[] = [];
    const warnings: string[] = [];

    for (const config of ENV_CONFIG) {
        const value = process.env[config.name];

        if (!value) {
            if (config.required) {
                missing.push(config.name);
            } else if (config.default) {
                process.env[config.name] = config.default;
                warnings.push(`${config.name} not set, using default: ${config.default}`);
            }
        }
    }

    // Log warnings for optional missing vars
    if (warnings.length > 0) {
        Logger.warn('[ENV] Using default values', { variables: warnings });
    }

    // Fail if required vars are missing
    if (missing.length > 0) {
        Logger.error('[ENV] Missing required environment variables', { missing });
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    Logger.info('[ENV] Environment validation passed');
}

/**
 * Get typed environment variable with fallback.
 */
export function getEnv(name: string, fallback?: string): string {
    return process.env[name] || fallback || '';
}

/**
 * Check if running in production mode.
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}
