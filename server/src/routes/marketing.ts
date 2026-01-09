/**
 * Marketing Route - Fastify Plugin
 */

import { FastifyPluginAsync } from 'fastify';
import { MarketingService } from '../services/MarketingService';
import { requireAuthFastify } from '../middleware/auth';
import { Logger } from '../utils/logger';

const service = new MarketingService();

const marketingRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', requireAuthFastify);

    // Campaigns
    fastify.get('/campaigns', async (request, reply) => {
        try {
            const campaigns = await service.listCampaigns(request.user!.accountId!);
            return campaigns;
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    fastify.post('/campaigns', async (request, reply) => {
        try {
            const campaign = await service.createCampaign(request.user!.accountId!, request.body as any);
            return campaign;
        } catch (e) {
            Logger.error('Error creating campaign', { error: e });
            return reply.code(500).send({ error: e });
        }
    });

    fastify.get<{ Params: { id: string } }>('/campaigns/:id', async (request, reply) => {
        try {
            const campaign = await service.getCampaign(request.params.id, request.user!.accountId!);
            if (!campaign) return reply.code(404).send({ error: 'Not found' });
            return campaign;
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    fastify.put<{ Params: { id: string } }>('/campaigns/:id', async (request, reply) => {
        try {
            await service.updateCampaign(request.params.id, request.user!.accountId!, request.body as any);
            return { success: true };
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    fastify.delete<{ Params: { id: string } }>('/campaigns/:id', async (request, reply) => {
        try {
            await service.deleteCampaign(request.params.id, request.user!.accountId!);
            return { success: true };
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    fastify.post<{ Params: { id: string }; Body: { email: string } }>('/campaigns/:id/test', async (request, reply) => {
        try {
            const { email } = request.body;
            await service.sendTestEmail(request.params.id, email);
            return { success: true };
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    // Automations
    fastify.get('/automations', async (request, reply) => {
        try {
            const automations = await service.listAutomations(request.user!.accountId!);
            return automations;
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    fastify.post('/automations', async (request, reply) => {
        try {
            const automation = await service.upsertAutomation(request.user!.accountId!, request.body as any);
            return automation;
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    fastify.get<{ Params: { id: string } }>('/automations/:id', async (request, reply) => {
        try {
            const automation = await service.getAutomation(request.params.id, request.user!.accountId!);
            if (!automation) return reply.code(404).send({ error: 'Not found' });
            return automation;
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    fastify.delete<{ Params: { id: string } }>('/automations/:id', async (request, reply) => {
        try {
            await service.deleteAutomation(request.params.id, request.user!.accountId!);
            return { success: true };
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    // Templates
    fastify.get('/templates', async (request, reply) => {
        try {
            const templates = await service.listTemplates(request.user!.accountId!);
            return templates;
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    fastify.post('/templates', async (request, reply) => {
        try {
            const template = await service.upsertTemplate(request.user!.accountId!, request.body as any);
            return template;
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });

    fastify.delete<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
        try {
            await service.deleteTemplate(request.params.id, request.user!.accountId!);
            return { success: true };
        } catch (e) {
            return reply.code(500).send({ error: e });
        }
    });
};

export default marketingRoutes;
