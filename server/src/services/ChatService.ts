
import { prisma } from '../utils/prisma';
import { Server, Socket } from 'socket.io';
import { Logger } from '../utils/logger';

export class ChatService {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    // --- Conversations ---

    async listConversations(accountId: String, status?: string, assignedTo?: string) {
        return prisma.conversation.findMany({
            where: {
                accountId: String(accountId),
                status: status || undefined,
                assignedTo: assignedTo || undefined,
                mergedIntoId: null // Don't show merged/archived ones by default
            },
            include: {
                wooCustomer: true,
                assignee: { select: { id: true, fullName: true, avatarUrl: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async createConversation(accountId: String, wooCustomerId?: string, visitorToken?: string) {
        // Check for existing open conversation for this visitor/customer
        const existing = await prisma.conversation.findFirst({
            where: {
                accountId: String(accountId),
                status: 'OPEN',
                OR: [
                    { wooCustomerId: wooCustomerId || undefined },
                    { visitorToken: visitorToken || undefined }
                ]
            }
        });

        if (existing) return existing;

        return prisma.conversation.create({
            data: {
                accountId: String(accountId),
                wooCustomerId,
                visitorToken,
                status: 'OPEN'
            }
        });
    }

    async getConversation(id: string) {
        return prisma.conversation.findUnique({
            where: { id },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
                wooCustomer: true,
                assignee: true
            }
        });
    }

    // --- Messages ---

    async addMessage(
        conversationId: string,
        content: string,
        senderType: 'AGENT' | 'CUSTOMER' | 'SYSTEM',
        senderId?: string,
        isInternal: boolean = false
    ) {
        const message = await prisma.message.create({
            data: {
                conversationId,
                content,
                senderType,
                senderId,
                isInternal
            }
        });

        // Update conversation timestamp
        const conversation = await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date(), status: 'OPEN' } // Re-open if closed
        });

        // Emit socket event
        this.io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Notify account room (for inbox lists)
        this.io.to(`account:${conversation.accountId}`).emit('conversation:updated', {
            id: conversationId,
            lastMessage: message,
            updatedAt: new Date()
        });

        // Handle Auto-Replies if sender is CUSTOMER
        if (senderType === 'CUSTOMER') {
            await this.handleAutoReply(conversation);

            // Send push notification for customer messages
            const { PushNotificationService } = require('./PushNotificationService');
            await PushNotificationService.sendToAccount(conversation.accountId, {
                title: '💬 New Chat Message',
                body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                data: { url: '/inbox' }
            }, 'message');
        }

        return message;
    }

    // --- Actions ---

    async assignConversation(id: string, userId: string) {
        const conv = await prisma.conversation.update({
            where: { id },
            data: { assignedTo: userId }
        });
        this.io.to(`conversation:${id}`).emit('conversation:assigned', { userId });
        return conv;
    }

    async updateStatus(id: string, status: string) {
        return prisma.conversation.update({
            where: { id },
            data: { status }
        });
    }

    async mergeConversations(targetId: string, sourceId: string) {
        // 1. Move all messages from source to target
        await prisma.message.updateMany({
            where: { conversationId: sourceId },
            data: { conversationId: targetId }
        });

        // 2. Mark source as merged
        await prisma.conversation.update({
            where: { id: sourceId },
            data: {
                status: 'CLOSED',
                mergedIntoId: targetId
            }
        });

        // 3. Add system note
        await this.addMessage(targetId, `Merged conversation #${sourceId} into this thread.`, 'SYSTEM');

        return { success: true };
    }

    async linkCustomer(conversationId: string, wooCustomerId: string) {
        return prisma.conversation.update({
            where: { id: conversationId },
            data: { wooCustomerId }
        });
    }

    // --- Internal Logic ---

    /**
     * Checks if current time is outside business hours for the account.
     * Uses the day schedule from CHAT_SETTINGS to determine open/closed status.
     */
    private isOutsideBusinessHours(businessHours: any): boolean {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const now = new Date();
        const dayKey = days[now.getDay()];
        const schedule = businessHours.days?.[dayKey];

        // If no schedule for today or marked as closed, we're outside hours
        if (!schedule || !schedule.isOpen) return true;

        const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" format
        return currentTime < schedule.open || currentTime > schedule.close;
    }

    /**
     * Handles auto-reply logic for incoming customer messages.
     * Sends an offline message if business hours are enabled and we're outside operating hours.
     */
    private async handleAutoReply(conversation: any) {
        const config = await prisma.accountFeature.findFirst({
            where: { accountId: conversation.accountId, featureKey: 'CHAT_SETTINGS' }
        });

        if (!config?.isEnabled || !config.config) return;

        const settings = config.config as any;

        // Check if business hours auto-reply is enabled
        if (!settings.businessHours?.enabled) return;

        const isOutsideHours = this.isOutsideBusinessHours(settings.businessHours);

        if (isOutsideHours && settings.businessHours.offlineMessage) {
            Logger.info(`[AutoReply] Sending offline message for conversation`, {
                conversationId: conversation.id
            });
            await this.addMessage(
                conversation.id,
                settings.businessHours.offlineMessage,
                'SYSTEM'
            );
        }
    }
    async handleIncomingEmail(emailData: {
        emailAccountId: string;
        fromEmail: string;
        fromName?: string;
        subject: string;
        body: string;
        messageId: string;
    }) {
        const { emailAccountId, fromEmail, fromName, subject, body, messageId } = emailData;

        // 1. Find the Account ID for this Email Account
        const emailVars = await prisma.emailAccount.findUnique({
            where: { id: emailAccountId },
            select: { accountId: true }
        });

        if (!emailVars) {
            Logger.error(`Email Account not found`, { emailAccountId });
            return;
        }

        const accountId = emailVars.accountId;

        // 2. Try to find an open conversation with this customer email
        // We need to look up WooCustomer by email first to find conversation linked to them
        // OR search conversation by some other means (e.g. subject containing Ticket ID in future)
        let conversation = await prisma.conversation.findFirst({
            where: {
                accountId,
                status: 'OPEN',
                wooCustomer: { email: fromEmail }
            }
        });

        // 3. If no conversation, create one
        if (!conversation) {
            // Find or create WooCustomer placeholder? 
            // For now, let's see if we have a customer with this email
            const customer = await prisma.wooCustomer.findFirst({
                where: { accountId, email: fromEmail }
            });

            conversation = await prisma.conversation.create({
                data: {
                    accountId,
                    status: 'OPEN',
                    wooCustomerId: customer?.id,
                    // Store guest info if no customer found
                    guestEmail: customer ? undefined : fromEmail,
                    guestName: customer ? undefined : fromName || undefined,
                    priority: 'MEDIUM'
                }
            });

            if (!customer) {
                // Determine if we should create a "Lead" or just leave it.
                // Let's prepend a header in the message body for now.
            }
        }

        // 4. Add the message
        await this.addMessage(
            conversation.id,
            `Subject: ${subject}\n\n${body}`,
            'CUSTOMER',
            undefined, // No senderId if we don't have a user/customer ID exactly linked yet. 
            // Note: addMessage logic might need tweaking if senderId is required? 
            // schema says senderId is String? (optional).
            false
        );

        Logger.info(`Imported email to Conversation`, { fromEmail, conversationId: conversation.id });
    }
}

