/**
 * Customers Route - Fastify Plugin
 */

import { FastifyPluginAsync } from 'fastify';
import { CustomersService } from '../services/customers';
import { requireAuthFastify } from '../middleware/auth';
import { Logger } from '../utils/logger';

const customersRoutes: FastifyPluginAsync = async (fastify) => {
    // Apply auth to all routes in this plugin
    fastify.addHook('preHandler', requireAuthFastify);

    fastify.get('/', async (request, reply) => {
        try {
            const accountId = request.accountId!;

            const query = request.query as { page?: string; limit?: string; q?: string };
            const page = parseInt(query.page || '1');
            const limit = parseInt(query.limit || '20');
            const q = query.q || '';

            const result = await CustomersService.searchCustomers(accountId, q, page, limit);
            return result;
        } catch (error: any) {
            Logger.error('Failed to fetch customers', { error });
            return reply.code(500).send({ error: 'Failed to fetch customers' });
        }
    });

    fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const customerId = request.params.id;

            Logger.debug(`GET /customers/${customerId}`, { accountId });

            const result = await CustomersService.getCustomerDetails(accountId, customerId);

            if (!result) {
                Logger.debug(`Customer not found`, { customerId });
                return reply.code(404).send({ error: 'Customer not found' });
            }

            return result;
        } catch (error: any) {
            Logger.error('Get Customer Details Error', { error });
            return reply.code(500).send({ error: 'Failed to fetch customer details' });
        }
    });
};

export default customersRoutes;
