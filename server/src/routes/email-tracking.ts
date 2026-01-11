/**
 * Email tracking route for read receipts.
 * Serves a 1x1 transparent GIF and logs email opens.
 */
import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';

// 1x1 transparent GIF (smallest valid GIF)
const TRANSPARENT_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

const emailTrackingRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * Track email opens via invisible pixel.
     * 
     * GET /api/email/track/:id.png
     * 
     * - Public route (no auth required)
     * - Returns 1x1 transparent GIF
     * - Logs open event to database
     */
    fastify.get<{ Params: { id: string } }>(
        '/track/:id.png',
        {
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    },
                    required: ['id']
                }
            }
        },
        async (request, reply) => {
            const { id } = request.params;

            try {
                // Look up email log by tracking ID
                const emailLog = await prisma.emailLog.findUnique({
                    where: { trackingId: id }
                });

                if (emailLog) {
                    const now = new Date();

                    // Update email log: set firstOpenedAt if first open, increment count
                    await prisma.emailLog.update({
                        where: { id: emailLog.id },
                        data: {
                            firstOpenedAt: emailLog.firstOpenedAt ?? now,
                            openCount: { increment: 1 }
                        }
                    });

                    // Create tracking event for detailed analytics
                    await prisma.messageTrackingEvent.create({
                        data: {
                            emailLogId: emailLog.id,
                            eventType: 'OPEN',
                            userAgent: request.headers['user-agent'] || null,
                            // Privacy: only store country from geo lookup if needed
                            ipCountry: null
                        }
                    });

                    Logger.debug('Email opened', {
                        trackingId: id,
                        to: emailLog.to,
                        openCount: emailLog.openCount + 1
                    });
                }
            } catch (error) {
                // Don't fail the request on tracking errors - just log
                Logger.error('Email tracking error', { trackingId: id, error });
            }

            // Always return the transparent GIF, even on error
            return reply
                .header('Content-Type', 'image/gif')
                .header('Cache-Control', 'no-cache, no-store, must-revalidate')
                .header('Pragma', 'no-cache')
                .header('Expires', '0')
                .send(TRANSPARENT_GIF);
        }
    );
};

export default emailTrackingRoutes;
