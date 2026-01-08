
import { prisma } from '../utils/prisma';
import { cacheAside, CacheTTL, CacheNamespace } from '../utils/cache';

export class AnalyticsService {

    /**
     * Get Visitor Log (Real-time Traffic)
     * Includes last 10 events per session for action display
     * @param liveMode - If true, only returns sessions active in last 30 minutes
     */
    static async getVisitorLog(accountId: string, page = 1, limit = 50, liveMode = false) {
        if (!accountId) throw new Error("Account ID is required");
        const skip = (page - 1) * limit;

        // Build where clause with optional live mode filter
        const whereClause: any = { accountId };
        if (liveMode) {
            const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
            whereClause.lastActiveAt = { gte: thirtyMinsAgo };
        }

        const [sessions, total] = await Promise.all([
            prisma.analyticsSession.findMany({
                where: whereClause,
                orderBy: { lastActiveAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    visitorId: true,
                    email: true,
                    ipAddress: true,
                    country: true,
                    city: true,
                    lastActiveAt: true,
                    currentPath: true,
                    referrer: true,
                    deviceType: true,
                    browser: true,
                    os: true,
                    // UTM Attribution
                    utmSource: true,
                    utmMedium: true,
                    utmCampaign: true,
                    lastTouchSource: true,
                    wooCustomerId: true,
                    // Attribution fields for cross-visit tracking
                    totalVisits: true,
                    firstTouchSource: true,
                    firstTouchAt: true,
                    _count: {
                        select: { events: true }
                    },
                    events: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                        select: {
                            id: true,
                            type: true,
                            url: true,
                            pageTitle: true,
                            createdAt: true,
                            payload: true
                        }
                    }
                }
            }),
            prisma.analyticsSession.count({ where: whereClause })
        ]);

        // Batch fetch linked WooCustomer data for sessions with wooCustomerId
        const wooCustomerIds = sessions
            .map(s => s.wooCustomerId)
            .filter((id): id is number => id !== null);

        let customerMap = new Map<number, { firstName: string | null; lastName: string | null; email: string }>();

        if (wooCustomerIds.length > 0) {
            const customers = await prisma.wooCustomer.findMany({
                where: {
                    accountId,
                    wooId: { in: wooCustomerIds }
                },
                select: {
                    wooId: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            });

            for (const c of customers) {
                customerMap.set(c.wooId, { firstName: c.firstName, lastName: c.lastName, email: c.email });
            }
        }

        // Attach customer data to sessions
        const data = sessions.map(session => ({
            ...session,
            customer: session.wooCustomerId ? customerMap.get(session.wooCustomerId) || null : null
        }));

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Get Ecommerce Log (Transaction/Event Stream)
     * @param liveMode - If true, only returns events from last 30 minutes
     */
    static async getEcommerceLog(accountId: string, page = 1, limit = 50, liveMode = false) {
        const skip = (page - 1) * limit;

        const commerceTypes = ['add_to_cart', 'remove_from_cart', 'cart_view', 'checkout_view', 'checkout_start', 'checkout_success', 'purchase'];

        // Build where clause with optional live mode filter
        const whereClause: any = {
            session: { accountId },
            type: { in: commerceTypes }
        };
        if (liveMode) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            whereClause.createdAt = { gte: oneHourAgo };
        }

        const [data, total] = await Promise.all([
            prisma.analyticsEvent.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    session: {
                        select: {
                            visitorId: true,
                            email: true,
                            city: true,
                            country: true
                        }
                    }
                }
            }),
            prisma.analyticsEvent.count({ where: whereClause })
        ]);

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Get Visitor Profile
     * Includes visit history with grouped events per visit
     */
    static async getVisitorProfile(visitorId: string, accountId: string) {
        const session = await prisma.analyticsSession.findUnique({
            where: { accountId_visitorId: { accountId, visitorId } },
            include: {
                visits: {
                    orderBy: { startedAt: 'desc' },
                    take: 20, // Last 20 visits
                    include: {
                        events: {
                            orderBy: { createdAt: 'asc' }, // Chronological within visit
                            take: 100
                        }
                    }
                },
                // Fallback for legacy data: include events directly on session
                events: {
                    orderBy: { createdAt: 'desc' },
                    take: 100
                }
            }
        });

        if (!session) return null;

        // Calculate stats
        let customerData = null;
        if (session.wooCustomerId) {
            customerData = await prisma.wooCustomer.findUnique({
                where: { accountId_wooId: { accountId, wooId: session.wooCustomerId } }
            });
        }

        // Get total visit count
        const visitCount = await prisma.analyticsVisit.count({
            where: { sessionId: session.id }
        });

        return {
            session,
            customer: customerData,
            visits: session.visits,
            stats: {
                totalEvents: await prisma.analyticsEvent.count({ where: { sessionId: session.id } }),
                totalVisits: visitCount,
                firstSeen: await prisma.analyticsEvent.findFirst({
                    where: { sessionId: session.id },
                    orderBy: { createdAt: 'asc' },
                    select: { createdAt: true }
                })
            }
        };
    }

    /**
     * Get Channel Breakdown (Attribution)
     * Cached for 5 minutes to reduce DB load
     */
    static async getChannelBreakdown(accountId: string) {
        return cacheAside(
            `channel:${accountId}`,
            async () => {
                // Group by utmSource or Referrer
                const sources = await prisma.analyticsSession.groupBy({
                    by: ['utmSource'],
                    where: { accountId },
                    _count: {
                        _all: true
                    },
                    orderBy: {
                        _count: {
                            utmSource: 'desc'
                        }
                    },
                    take: 10
                });

                return sources.map(s => ({
                    name: s.utmSource || 'Direct / None',
                    count: s._count._all
                }));
            },
            { ttl: CacheTTL.MEDIUM, namespace: CacheNamespace.ANALYTICS }
        );
    }

    /**
     * Get Search Insights
     * Cached for 5 minutes due to in-memory aggregation
     */
    static async getSearchTerms(accountId: string) {
        return cacheAside(
            `search:${accountId}`,
            async () => {
                // Fetch last 500 search events and aggregate
                const events = await prisma.analyticsEvent.findMany({
                    where: {
                        session: { accountId },
                        type: 'search'
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 500,
                    select: { payload: true }
                });

                const termCounts: Record<string, number> = {};

                events.forEach(e => {
                    const term = (e.payload as any)?.term;
                    if (term) {
                        const lower = String(term).toLowerCase().trim();
                        termCounts[lower] = (termCounts[lower] || 0) + 1;
                    }
                });

                // Sort and return top 10
                return Object.entries(termCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([term, count]) => ({ term, count }));
            },
            { ttl: CacheTTL.MEDIUM, namespace: CacheNamespace.ANALYTICS }
        );
    }
}
