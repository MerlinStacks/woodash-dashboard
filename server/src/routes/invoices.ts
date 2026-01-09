/**
 * Invoices Route - Fastify Plugin
 */

import { FastifyPluginAsync } from 'fastify';
import { InvoiceService } from '../services/InvoiceService';
import { requireAuthFastify } from '../middleware/auth';
import { Logger } from '../utils/logger';

const invoiceService = new InvoiceService();

const invoicesRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', requireAuthFastify);

    // Get all templates for account
    fastify.get('/templates', async (request, reply) => {
        const accountId = request.user?.accountId;
        if (!accountId) return reply.code(400).send({ error: 'Account ID required' });

        try {
            const templates = await invoiceService.getTemplates(accountId);
            return templates;
        } catch (error) {
            Logger.error('Failed to fetch templates', { error });
            return reply.code(500).send({ error: 'Failed to fetch templates' });
        }
    });

    // Get specific template
    fastify.get<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
        const accountId = request.user?.accountId;
        if (!accountId) return reply.code(400).send({ error: 'Account ID required' });

        try {
            const template = await invoiceService.getTemplate(request.params.id, accountId);
            if (!template) return reply.code(404).send({ error: 'Template not found' });
            return template;
        } catch (error) {
            return reply.code(500).send({ error: 'Failed to fetch template' });
        }
    });

    // Create template
    fastify.post('/templates', async (request, reply) => {
        const accountId = request.user?.accountId;
        if (!accountId) return reply.code(400).send({ error: 'Account ID required' });

        try {
            const template = await invoiceService.createTemplate(accountId, request.body as any);
            return template;
        } catch (error: any) {
            Logger.error('Failed to create invoice template', { error, accountId, body: request.body });
            if (error?.code === 'P2002') {
                return reply.code(409).send({ error: 'A template with this name already exists' });
            }
            return reply.code(500).send({ error: 'Failed to create template' });
        }
    });

    // Update template
    fastify.put<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
        const accountId = request.user?.accountId;
        if (!accountId) return reply.code(400).send({ error: 'Account ID required' });

        try {
            const template = await invoiceService.updateTemplate(request.params.id, accountId, request.body as any);
            return template;
        } catch (error) {
            return reply.code(500).send({ error: 'Failed to update template' });
        }
    });
};

export default invoicesRoutes;
