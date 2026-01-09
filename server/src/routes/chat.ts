/**
 * Chat Routes - Fastify Plugin Factory
 * Requires ChatService injection for Socket.IO integration.
 */

import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../utils/prisma';
import { ChatService } from '../services/ChatService';
import { InboxAIService } from '../services/InboxAIService';
import { BlockedContactService } from '../services/BlockedContactService';
import { requireAuthFastify } from '../middleware/auth';
import { Logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

// Ensure attachments directory exists
const attachmentsDir = path.join(__dirname, '../../uploads/attachments');
if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
}

export const createChatRoutes = (chatService: ChatService): FastifyPluginAsync => {
    return async (fastify) => {
        fastify.addHook('preHandler', requireAuthFastify);

        // GET /conversations
        fastify.get('/conversations', async (request, reply) => {
            try {
                const query = request.query as { status?: string; assignedTo?: string };
                const accountId = request.headers['x-account-id'] as string;
                if (!accountId) return reply.code(400).send({ error: 'Account ID required' });

                const conversations = await chatService.listConversations(accountId, query.status, query.assignedTo);
                return conversations;
            } catch (error) {
                Logger.error('Failed to fetch conversations', { error });
                return reply.code(500).send({ error: 'Failed to fetch conversations' });
            }
        });

        // POST /conversations
        fastify.post('/conversations', async (request, reply) => {
            const { accountId, wooCustomerId, visitorToken } = request.body as any;
            const conv = await chatService.createConversation(accountId, wooCustomerId, visitorToken);
            return conv;
        });

        // GET /unread-count
        fastify.get('/unread-count', async (request, reply) => {
            try {
                const accountId = request.headers['x-account-id'] as string;
                if (!accountId) return reply.code(400).send({ error: 'Account ID required' });
                const count = await chatService.getUnreadCount(accountId);
                return { count };
            } catch (error) {
                Logger.error('Failed to get unread count', { error });
                return reply.code(500).send({ error: 'Failed to get unread count' });
            }
        });

        // --- Canned Responses ---
        fastify.get('/canned-responses', async (request, reply) => {
            const accountId = request.headers['x-account-id'] as string;
            if (!accountId) return {};
            const responses = await prisma.cannedResponse.findMany({ where: { accountId } });
            return responses;
        });

        fastify.post('/canned-responses', async (request, reply) => {
            const { shortcut, content, accountId } = request.body as any;
            const resp = await prisma.cannedResponse.create({ data: { shortcut, content, accountId } });
            return resp;
        });

        fastify.delete<{ Params: { id: string } }>('/canned-responses/:id', async (request, reply) => {
            await prisma.cannedResponse.delete({ where: { id: request.params.id } });
            return { success: true };
        });

        // --- Settings ---
        fastify.get('/settings', async (request, reply) => {
            const accountId = request.headers['x-account-id'] as string;
            if (!accountId) return {};
            const feature = await prisma.accountFeature.findUnique({
                where: { accountId_featureKey: { accountId, featureKey: 'CHAT_SETTINGS' } }
            });
            return feature?.config || {};
        });

        fastify.post('/settings', async (request, reply) => {
            const accountId = request.headers['x-account-id'] as string;
            if (!accountId) return {};
            const { businessHours, autoReply, position, showOnMobile } = request.body as any;
            const config = { businessHours, autoReply, position, showOnMobile };

            await prisma.accountFeature.upsert({
                where: { accountId_featureKey: { accountId, featureKey: 'CHAT_SETTINGS' } },
                update: { config, isEnabled: true },
                create: { accountId, featureKey: 'CHAT_SETTINGS', isEnabled: true, config }
            });
            return { success: true };
        });

        // GET /:id
        fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
            const conv = await chatService.getConversation(request.params.id);
            if (!conv) return reply.code(404).send({ error: 'Not found' });
            return conv;
        });

        // POST /:id/messages
        fastify.post<{ Params: { id: string } }>('/:id/messages', async (request, reply) => {
            const { content, type, isInternal } = request.body as any;
            const userId = request.user?.id;
            const msg = await chatService.addMessage(request.params.id, content, type || 'AGENT', userId, isInternal);
            return msg;
        });

        // PUT /:id
        fastify.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
            const { status, assignedTo, wooCustomerId } = request.body as any;
            const { id } = request.params;
            if (status) await chatService.updateStatus(id, status);
            if (assignedTo) await chatService.assignConversation(id, assignedTo);
            if (wooCustomerId) await chatService.linkCustomer(id, wooCustomerId);
            return { success: true };
        });

        // POST /:id/merge
        fastify.post<{ Params: { id: string } }>('/:id/merge', async (request, reply) => {
            const { sourceId } = request.body as any;
            await chatService.mergeConversations(request.params.id, sourceId);
            return { success: true };
        });

        // POST /:id/read
        fastify.post<{ Params: { id: string } }>('/:id/read', async (request, reply) => {
            try {
                await chatService.markAsRead(request.params.id);
                return { success: true };
            } catch (error) {
                Logger.error('Failed to mark conversation as read', { error });
                return reply.code(500).send({ error: 'Failed to mark as read' });
            }
        });

        // POST /:id/ai-draft
        fastify.post<{ Params: { id: string } }>('/:id/ai-draft', async (request, reply) => {
            try {
                const conversationId = request.params.id;
                const accountId = request.headers['x-account-id'] as string;
                if (!accountId) return reply.code(400).send({ error: 'Account ID required' });

                const result = await InboxAIService.generateDraftReply(conversationId, accountId);
                if (result.error) return reply.code(400).send({ error: result.error });
                return { draft: result.draft };
            } catch (error) {
                Logger.error('Failed to generate AI draft', { error });
                return reply.code(500).send({ error: 'Failed to generate AI draft' });
            }
        });

        // POST /:id/attachment (using @fastify/multipart)
        fastify.post<{ Params: { id: string } }>('/:id/attachment', async (request, reply) => {
            try {
                const data = await (request as any).file();
                if (!data) return reply.code(400).send({ error: 'No file uploaded' });

                const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv|zip/;
                const ext = path.extname(data.filename).toLowerCase();
                if (!allowedTypes.test(ext.slice(1))) {
                    return reply.code(400).send({ error: 'Invalid file type' });
                }

                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const filename = uniqueSuffix + '-' + data.filename;
                const filePath = path.join(attachmentsDir, filename);
                const writeStream = fs.createWriteStream(filePath);

                for await (const chunk of data.file) {
                    writeStream.write(chunk);
                }
                writeStream.end();

                const conversationId = request.params.id;
                const userId = request.user?.id;
                const attachmentUrl = `/uploads/attachments/${filename}`;
                const content = `[Attachment: ${data.filename}](${attachmentUrl})`;

                const msg = await chatService.addMessage(conversationId, content, 'AGENT', userId, false);

                return {
                    success: true,
                    message: msg,
                    attachment: { url: attachmentUrl, name: data.filename, type: data.mimetype }
                };
            } catch (error) {
                Logger.error('Failed to upload attachment', { error });
                return reply.code(500).send({ error: 'Failed to upload attachment' });
            }
        });

        // --- Blocked Contacts ---
        fastify.post('/block', async (request, reply) => {
            try {
                const accountId = request.headers['x-account-id'] as string;
                if (!accountId) return reply.code(400).send({ error: 'Account ID required' });

                const { email, reason } = request.body as any;
                if (!email) return reply.code(400).send({ error: 'Email is required' });

                const result = await BlockedContactService.blockContact(accountId, email, request.user?.id, reason);
                if (!result.success) return reply.code(500).send({ error: result.error });
                return { success: true };
            } catch (error) {
                Logger.error('Failed to block contact', { error });
                return reply.code(500).send({ error: 'Failed to block contact' });
            }
        });

        fastify.delete<{ Params: { email: string } }>('/block/:email', async (request, reply) => {
            try {
                const accountId = request.headers['x-account-id'] as string;
                if (!accountId) return reply.code(400).send({ error: 'Account ID required' });

                const result = await BlockedContactService.unblockContact(accountId, decodeURIComponent(request.params.email));
                if (!result.success) return reply.code(500).send({ error: result.error });
                return { success: true };
            } catch (error) {
                Logger.error('Failed to unblock contact', { error });
                return reply.code(500).send({ error: 'Failed to unblock contact' });
            }
        });

        fastify.get('/blocked', async (request, reply) => {
            try {
                const accountId = request.headers['x-account-id'] as string;
                if (!accountId) return reply.code(400).send({ error: 'Account ID required' });
                const blocked = await BlockedContactService.listBlocked(accountId);
                return blocked;
            } catch (error) {
                Logger.error('Failed to list blocked contacts', { error });
                return reply.code(500).send({ error: 'Failed to list blocked contacts' });
            }
        });

        fastify.get<{ Params: { email: string } }>('/block/check/:email', async (request, reply) => {
            try {
                const accountId = request.headers['x-account-id'] as string;
                if (!accountId) return reply.code(400).send({ error: 'Account ID required' });

                const isBlocked = await BlockedContactService.isBlocked(accountId, decodeURIComponent(request.params.email));
                return { isBlocked };
            } catch (error) {
                Logger.error('Failed to check blocked status', { error });
                return reply.code(500).send({ error: 'Failed to check blocked status' });
            }
        });

        // === MESSAGE REACTIONS ===
        fastify.post<{ Params: { messageId: string } }>('/messages/:messageId/reactions', async (request, reply) => {
            try {
                const { messageId } = request.params;
                const { emoji } = request.body as any;
                const userId = request.user?.id;

                if (!emoji) return reply.code(400).send({ error: 'Emoji is required' });

                const existingReaction = await prisma.messageReaction.findUnique({
                    where: { messageId_userId_emoji: { messageId, userId: userId!, emoji } }
                });

                if (existingReaction) {
                    await prisma.messageReaction.delete({ where: { id: existingReaction.id } });
                    return { action: 'removed', emoji };
                } else {
                    const reaction = await prisma.messageReaction.create({
                        data: { messageId, userId: userId!, emoji },
                        include: { user: { select: { id: true, fullName: true } } }
                    });
                    return { action: 'added', reaction };
                }
            } catch (error) {
                Logger.error('Failed to toggle reaction', { error });
                return reply.code(500).send({ error: 'Failed to toggle reaction' });
            }
        });

        fastify.get<{ Params: { messageId: string } }>('/messages/:messageId/reactions', async (request, reply) => {
            try {
                const { messageId } = request.params;
                const reactions = await prisma.messageReaction.findMany({
                    where: { messageId },
                    include: { user: { select: { id: true, fullName: true } } }
                });

                const grouped = reactions.reduce((acc, r) => {
                    if (!acc[r.emoji]) acc[r.emoji] = [];
                    acc[r.emoji].push({ userId: r.user.id, userName: r.user.fullName });
                    return acc;
                }, {} as Record<string, Array<{ userId: string; userName: string | null }>>);

                return grouped;
            } catch (error) {
                Logger.error('Failed to fetch reactions', { error });
                return reply.code(500).send({ error: 'Failed to fetch reactions' });
            }
        });
    };
};

// Legacy export for backward compatibility
export { createChatRoutes as createChatRouter };
