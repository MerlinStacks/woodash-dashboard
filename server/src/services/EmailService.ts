
import { PrismaClient, EmailAccount } from '@prisma/client';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { prisma } from '../utils/prisma';
import { EventBus, EVENTS } from './events';
import { Logger } from '../utils/logger';
import { decrypt } from '../utils/encryption';


export class EmailService {

    // -------------------
    // Sending (SMTP)
    // -------------------

    async createTransporter(account: EmailAccount) {
        // Port 465 uses implicit TLS, port 587 uses STARTTLS
        const useImplicitTLS = account.port === 465;

        return nodemailer.createTransport({
            host: account.host,
            port: account.port,
            secure: useImplicitTLS, // true for 465 only
            requireTLS: !useImplicitTLS && account.isSecure, // Force STARTTLS for 587 when secure is wanted
            auth: {
                user: account.username,
                pass: account.password,
            },
            tls: {
                // Allow connections to servers with mismatched certificates
                // (common with shared hosting like cPanel)
                rejectUnauthorized: false,
                servername: account.host
            }
        });
    }

    async sendEmail(accountId: string, emailAccountId: string, to: string, subject: string, html: string, attachments?: any[]) {
        const emailAccount = await prisma.emailAccount.findFirst({
            where: { id: emailAccountId, accountId }
        });

        if (!emailAccount) throw new Error("Email account not found");

        const transporter = await this.createTransporter(emailAccount);

        const info = await transporter.sendMail({
            from: `"${emailAccount.name}" <${emailAccount.email}>`,
            to,
            subject,
            html,
            attachments
        });

        Logger.info(`Sent email`, { messageId: info.messageId, to });
        return info;
    }

    async verifyConnection(account: EmailAccount): Promise<boolean> {
        if (account.type === 'SMTP') {
            try {
                const transporter = await this.createTransporter(account);
                await transporter.verify();
                return true;
            } catch (error) {
                Logger.error('SMTP Verify Error', { error });
                throw error;
            }
        } else if (account.type === 'IMAP') {
            try {
                // Port 993 uses implicit TLS (connection is encrypted from start)
                // Port 143 uses STARTTLS (connection starts plain, then upgrades)
                const useImplicitTLS = account.port === 993;

                const client = new ImapFlow({
                    host: account.host,
                    port: account.port,
                    secure: useImplicitTLS,
                    auth: {
                        user: account.username,
                        pass: account.password
                    },
                    logger: false,
                    tls: {
                        rejectUnauthorized: false,
                    } as any
                });

                await client.connect();
                await client.logout();
                return true;
            } catch (error) {
                Logger.error('IMAP Verify Error', { error });
                throw error;
            }
        }
        return false;
    }

    // -------------------
    // Receiving (IMAP)
    // -------------------

    async checkEmails(emailAccountId: string) {
        const account = await prisma.emailAccount.findUnique({ where: { id: emailAccountId } });
        if (!account) {
            Logger.warn('[checkEmails] Email account not found', { emailAccountId });
            return;
        }
        if (account.type !== 'IMAP') {
            Logger.warn('[checkEmails] Account is not IMAP type, skipping', { emailAccountId, type: account.type });
            return;
        }

        // Port 993 uses implicit TLS, port 143 uses STARTTLS
        const useImplicitTLS = account.port === 993;

        // Decrypt the stored password
        let decryptedPassword: string;
        try {
            decryptedPassword = decrypt(account.password);
        } catch (e) {
            Logger.error('[checkEmails] Failed to decrypt email password', { emailAccountId, error: e });
            return;
        }

        const client = new ImapFlow({
            host: account.host,
            port: account.port,
            secure: useImplicitTLS,
            auth: {
                user: account.username,
                pass: decryptedPassword
            },
            logger: false,
            tls: {
                rejectUnauthorized: false,
            } as any
        });

        try {
            Logger.info('[checkEmails] Connecting to IMAP server', { host: account.host, port: account.port });
            await client.connect();

            // Get mailbox lock for safe concurrent access
            const lock = await client.getMailboxLock('INBOX');
            Logger.info('[checkEmails] Connected and locked INBOX');

            let messageCount = 0;

            try {
                // Fetch unseen messages using async iterator
                for await (const message of client.fetch({ seen: false }, {
                    envelope: true,
                    bodyStructure: true,
                    source: true
                })) {
                    messageCount++;
                    try {
                        const envelope = message.envelope;
                        const subject = envelope.subject || '(No Subject)';
                        const fromAddress = envelope.from?.[0];
                        const fromEmail = fromAddress?.address || '';
                        const fromName = fromAddress?.name || '';
                        const messageId = envelope.messageId || `local-${Date.now()}`;
                        const inReplyTo = envelope.inReplyTo || null;

                        // References not directly on envelope, parse from source if needed
                        const references = null; // Can be extracted from source if required

                        // Get body from source (raw email)
                        const body = message.source?.toString() || '[Content cannot be displayed]';

                        Logger.info(`[checkEmails] Processing email`, { fromEmail, subject, inReplyTo: !!inReplyTo });

                        // Mark as seen
                        await client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });

                        EventBus.emit(EVENTS.EMAIL.RECEIVED, {
                            emailAccountId,
                            fromEmail,
                            fromName,
                            subject,
                            body,
                            messageId,
                            inReplyTo,
                            references
                        });

                        Logger.info(`[checkEmails] Emitted EMAIL.RECEIVED event`, { fromEmail, subject });
                    } catch (msgError: any) {
                        Logger.error('[checkEmails] Error processing individual message', {
                            messageUid: message.uid,
                            error: msgError?.message || String(msgError)
                        });
                    }
                }

                Logger.info(`[checkEmails] Found ${messageCount} unseen email(s)`, { email: account.email });
            } finally {
                // Always release the lock
                lock.release();
            }

            await client.logout();
            Logger.info('[checkEmails] Disconnected from IMAP server');
        } catch (error: any) {
            Logger.error(`[checkEmails] Error checking emails`, {
                email: account.email,
                error: error?.message || String(error),
                stack: error?.stack
            });
            // Ensure we try to close the connection on error
            try {
                await client.logout();
            } catch { /* ignore logout errors */ }
        }
    }
}
