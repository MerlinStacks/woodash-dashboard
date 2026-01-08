/**
 * Health Check Route
 * 
 * Provides health and readiness endpoints for monitoring.
 */

import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { redisClient } from '../utils/redis';
import { esClient } from '../utils/elastic';
import { Logger } from '../utils/logger';

const router = Router();

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    checks: {
        database: boolean;
        redis: boolean;
        elasticsearch: boolean;
    };
}

/**
 * GET /health
 * Basic health check - returns 200 if server is running.
 */
router.get('/', (_req, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * GET /health/ready
 * Readiness check - verifies all dependencies are connected.
 */
router.get('/ready', async (_req, res: Response) => {
    const checks = {
        database: false,
        redis: false,
        elasticsearch: false
    };

    // Check database
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = true;
    } catch (error) {
        Logger.warn('[Health] Database check failed', { error });
    }

    // Check Redis
    try {
        await redisClient.ping();
        checks.redis = true;
    } catch (error) {
        Logger.warn('[Health] Redis check failed', { error });
    }

    // Check Elasticsearch
    try {
        const esHealth = await esClient.cluster.health();
        checks.elasticsearch = esHealth.status !== 'red';
    } catch (error) {
        Logger.warn('[Health] Elasticsearch check failed', { error });
    }

    const allHealthy = Object.values(checks).every(Boolean);
    const status: HealthStatus = {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        checks
    };

    res.status(allHealthy ? 200 : 503).json(status);
});

/**
 * GET /health/live
 * Liveness check - simple ping for container orchestrators.
 */
router.get('/live', (_req, res: Response) => {
    res.status(200).send('OK');
});

export default router;
