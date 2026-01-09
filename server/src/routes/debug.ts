/**
 * Debug Route - Fastify Plugin
 */

import { FastifyPluginAsync } from 'fastify';
import { esClient } from '../utils/elastic';

const debugRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get('/count', async (request, reply) => {
        try {
            const result = await esClient.count({
                index: 'customers'
            });
            return { count: result.count };
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
};

export default debugRoutes;
