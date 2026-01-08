/**
 * Live analytics service for real-time visitor and cart tracking.
 *
 * Provides methods to retrieve currently active visitors and carts for
 * live dashboard views.
 */

import { prisma } from '../../utils/prisma';
import { isBot } from './TrafficAnalyzer';
import { calculatePurchaseIntent } from './CohortLTVService';

/**
 * Cart item structure from the cartItems JSON field.
 */
export interface LiveCartItem {
    productId: number;
    variationId?: number;
    name: string;
    sku?: string;
    thumbnail?: string;
    quantity: number;
    price: number;
    total: number;
}

/**
 * Enhanced live cart session with product details and customer info.
 */
export interface LiveCartSession {
    id: string;
    visitorId: string;
    email?: string | null;
    cartValue: number;
    cartItems: LiveCartItem[];
    itemCount: number;
    currency: string;
    lastActiveAt: Date;
    country?: string | null;
    city?: string | null;
    // Customer info if known
    customerName?: string | null;
    customerId?: number | null;
    // Calculated metrics
    purchaseIntentScore: number;
    minutesSinceActivity: number;
}

/**
 * Get Live Visitors (Active in last 3 mins).
 * Filters out bots and sessions without userAgent.
 *
 * @param accountId - The account ID to query
 * @returns Array of active visitor sessions (max 50)
 */
export async function getLiveVisitors(accountId: string) {
    const threeMinsAgo = new Date(Date.now() - 3 * 60 * 1000);

    const sessions = await prisma.analyticsSession.findMany({
        where: {
            accountId,
            lastActiveAt: {
                gte: threeMinsAgo
            },
            // Exclude sessions with no userAgent (likely bots or server-side requests)
            userAgent: {
                not: null
            }
        },
        orderBy: {
            lastActiveAt: 'desc'
        },
        take: 100 // Fetch more initially, we'll filter further
    });

    // Post-filter to catch any bots that slipped through ingestion
    // Also filter out empty userAgent strings
    const filteredSessions = sessions.filter(session => {
        if (!session.userAgent || session.userAgent.trim() === '') return false;
        return !isBot(session.userAgent);
    });

    return filteredSessions.slice(0, 50); // Cap at 50 for live view
}

/**
 * Get Active Carts (Live sessions with cart items).
 * Returns enhanced cart data with product details and customer info.
 *
 * @param accountId - The account ID to query
 * @returns Array of LiveCartSession with enriched data
 */
export async function getLiveCarts(accountId: string): Promise<LiveCartSession[]> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const now = Date.now();

    // Fetch sessions with carts
    const sessions = await prisma.analyticsSession.findMany({
        where: {
            accountId,
            cartValue: {
                gt: 0
            },
            lastActiveAt: {
                gte: oneHourAgo
            }
        },
        orderBy: {
            cartValue: 'desc'
        },
        take: 50
    });

    // Collect customer IDs for batch lookup
    const customerIds = sessions
        .filter(s => s.wooCustomerId)
        .map(s => s.wooCustomerId as number);

    // Batch fetch customer names
    const customers = customerIds.length > 0
        ? await prisma.wooCustomer.findMany({
            where: {
                accountId,
                wooId: { in: customerIds }
            },
            select: {
                wooId: true,
                firstName: true,
                lastName: true
            }
        })
        : [];

    // Create lookup map
    const customerMap = new Map(
        customers.map(c => [c.wooId, `${c.firstName || ''} ${c.lastName || ''}`.trim()])
    );

    // Transform sessions to enhanced format
    return sessions.map(session => {
        // Parse cart items from JSON field
        let cartItems: LiveCartItem[] = [];
        let itemCount = 0;

        if (session.cartItems && Array.isArray(session.cartItems)) {
            cartItems = (session.cartItems as any[]).map(item => ({
                productId: item.productId || item.product_id || 0,
                variationId: item.variationId || item.variation_id,
                name: item.name || item.product_name || 'Unknown Product',
                sku: item.sku,
                thumbnail: item.thumbnail || item.image,
                quantity: item.quantity || 1,
                price: parseFloat(item.price) || 0,
                total: parseFloat(item.total || item.line_total) || (parseFloat(item.price) * (item.quantity || 1))
            }));
            itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        }

        // Calculate minutes since last activity
        const minutesSinceActivity = Math.floor(
            (now - new Date(session.lastActiveAt).getTime()) / 60000
        );

        // Get customer name if available
        const customerName = session.wooCustomerId
            ? customerMap.get(session.wooCustomerId) || null
            : null;

        // Calculate purchase intent score (0-100)
        const purchaseIntentScore = calculatePurchaseIntent(session);

        return {
            id: session.id,
            visitorId: session.visitorId,
            email: session.email,
            cartValue: Number(session.cartValue),
            cartItems,
            itemCount,
            currency: session.currency,
            lastActiveAt: session.lastActiveAt,
            country: session.country,
            city: session.city,
            customerName,
            customerId: session.wooCustomerId,
            purchaseIntentScore,
            minutesSinceActivity
        };
    });
}

/**
 * Get Session History - all events for a specific session.
 *
 * @param sessionId - The session ID to query
 * @returns Array of analytics events in descending order by creation time
 */
export async function getSessionHistory(sessionId: string) {
    return prisma.analyticsEvent.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' }
    });
}
