/**
 * Public Chat Routes - Fastify Plugin Factory
 * Public-facing endpoints for guest visitors.
 */

import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../utils/prisma';
import { ChatService } from '../services/ChatService';
import { Logger } from '../utils/logger';

export const createPublicChatRoutes = (chatService: ChatService): FastifyPluginAsync => {
    return async (fastify) => {
        // POST /conversation - Start or resume a conversation for a guest visitor
        fastify.post('/conversation', async (request, reply) => {
            try {
                const { accountId, visitorToken, name, email } = request.body as any;

                if (!accountId || !visitorToken) {
                    return reply.code(400).send({ error: 'Missing accountId or visitorToken' });
                }

                // Check for existing open conversation
                let conversation = await prisma.conversation.findFirst({
                    where: { accountId, visitorToken, status: 'OPEN' },
                    include: {
                        messages: { orderBy: { createdAt: 'asc' } },
                        assignee: { select: { id: true, fullName: true, avatarUrl: true } }
                    }
                });

                // If not found, create new
                if (!conversation) {
                    conversation = await prisma.conversation.create({
                        data: { accountId, visitorToken, status: 'OPEN' },
                        include: {
                            messages: true,
                            assignee: { select: { id: true, fullName: true, avatarUrl: true } }
                        }
                    });
                }

                return conversation;
            } catch (error) {
                Logger.error('Public chat conversation error', { error });
                return reply.code(500).send({ error: 'Failed to start conversation' });
            }
        });

        // POST /:id/messages - Send a message as a guest
        fastify.post<{ Params: { id: string } }>('/:id/messages', async (request, reply) => {
            try {
                const { content, visitorToken } = request.body as any;
                const conversationId = request.params.id;

                const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
                if (!conversation || conversation.visitorToken !== visitorToken) {
                    return reply.code(403).send({ error: 'Unauthorized access to conversation' });
                }

                const msg = await chatService.addMessage(conversationId, content, 'CUSTOMER');
                return msg;
            } catch (error) {
                Logger.error('Public message error', { error });
                return reply.code(500).send({ error: 'Failed to send message' });
            }
        });

        // GET /:id/messages - Poll for updates
        fastify.get<{ Params: { id: string } }>('/:id/messages', async (request, reply) => {
            try {
                const query = request.query as { visitorToken?: string; after?: string };
                const conversationId = request.params.id;

                const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
                if (!conversation || conversation.visitorToken !== query.visitorToken) {
                    return reply.code(403).send({ error: 'Unauthorized' });
                }

                const whereClause: any = { conversationId };
                if (query.after) {
                    whereClause.createdAt = { gt: new Date(query.after) };
                }

                const messages = await prisma.message.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'asc' }
                });

                return messages;
            } catch (error) {
                Logger.error('Public poll error', { error });
                return reply.code(500).send({ error: 'Failed to fetch messages' });
            }
        });
    };
};

// Legacy export for backward compatibility
export { createPublicChatRoutes as createPublicChatRouter };
