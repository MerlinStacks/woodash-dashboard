/**
 * Segments Route - Fastify Plugin
 */

import { FastifyPluginAsync } from 'fastify';
import { requireAuthFastify } from '../middleware/auth';
import { segmentService } from '../services/SegmentService';
import { Logger } from '../utils/logger';

const segmentsRoutes: FastifyPluginAsync = async (fastify) => {
    // Apply auth to all routes
    fastify.addHook('preHandler', requireAuthFastify);

    // List Segments
    fastify.get('/', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const segments = await segmentService.listSegments(accountId);
            return segments;
        } catch (error) {
            Logger.error('Error', { error });
            return reply.code(500).send({ error: 'Failed to list segments' });
        }
    });

    // Create Segment
    fastify.post('/', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const segment = await segmentService.createSegment(accountId, request.body as any);
            return segment;
        } catch (error) {
            Logger.error('Error', { error });
            return reply.code(500).send({ error: 'Failed to create segment' });
        }
    });

    // Get Segment
    fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const segment = await segmentService.getSegment(request.params.id, accountId);
            if (!segment) return reply.code(404).send({ error: 'Segment not found' });
            return segment;
        } catch (error) {
            Logger.error('Error', { error });
            return reply.code(500).send({ error: 'Failed to get segment' });
        }
    });

    // Update Segment
    fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            await segmentService.updateSegment(request.params.id, accountId, request.body as any);
            return { success: true };
        } catch (error) {
            Logger.error('Error', { error });
            return reply.code(500).send({ error: 'Failed to update segment' });
        }
    });

    // Delete Segment
    fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            await segmentService.deleteSegment(request.params.id, accountId);
            return { success: true };
        } catch (error) {
            Logger.error('Error', { error });
            return reply.code(500).send({ error: 'Failed to delete segment' });
        }
    });

    // Preview Customers in Segment
    fastify.get<{ Params: { id: string } }>('/:id/preview', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const customers = await segmentService.previewCustomers(accountId, request.params.id);
            return customers;
        } catch (error) {
            Logger.error('Error', { error });
            return reply.code(500).send({ error: 'Failed to preview segment' });
        }
    });
};

export default segmentsRoutes;
