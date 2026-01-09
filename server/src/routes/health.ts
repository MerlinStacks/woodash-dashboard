/**
 * Health Check Route - Fastify Plugin
 * 
 * Provides health and readiness endpoints for monitoring.
 */

import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../utils/prisma';
import { redisClient } from '../utils/redis';
import { esClient } from '../utils/elastic';
import { Logger } from '../utils/logger';

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

const healthRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /health
     * Basic health check - returns 200 if server is running.
     */
    fastify.get('/', async (request, reply) => {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };
    });

    /**
     * GET /health/ready
     * Readiness check - verifies all dependencies are connected.
     */
    fastify.get('/ready', async (request, reply) => {
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

        return reply.code(allHealthy ? 200 : 503).send(status);
    });

    /**
     * GET /health/live
     * Liveness check - simple ping for container orchestrators.
     */
    fastify.get('/live', async (request, reply) => {
        return reply.code(200).send('OK');
    });
};

export default healthRoutes;
