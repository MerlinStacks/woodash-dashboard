
import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { compileToHtml } from '../lib/mjml.js';

export async function emailRoutes(fastify: FastifyInstance) {
    // fastify.addHook('preHandler', requireAuth); // Optional: Disable for easier testing if needed, but best to keep

    fastify.post('/render', async (req, reply) => {
        try {
            const templateData = req.body as any;

            if (!templateData || !templateData.blocks) {
                return reply.status(400).send({ error: 'Invalid payload: blocks missing' });
            }

            const result = compileToHtml(templateData);
            return result;
        } catch (e: any) {
            req.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });
}
