import { BaseSync } from './BaseSync';
import { WooService } from '../woo';
import { PrismaClient } from '@prisma/client';
import { EventBus, EVENTS } from '../events';
import { Logger } from '../../utils/logger';
import { IndexingService } from '../search/IndexingService';

const prisma = new PrismaClient();

export class ReviewSync extends BaseSync {
    protected entityType = 'reviews';

    protected async sync(woo: WooService, accountId: string, incremental: boolean, job?: any): Promise<void> {
        const after = incremental ? await this.getLastSync(accountId) : undefined;
        let page = 1;
        let hasMore = true;
        let totalProcessed = 0;

        while (hasMore) {
            const { data: reviews, totalPages } = await woo.getReviews({ page, after, per_page: 50 });
            if (!reviews.length) {
                hasMore = false;
                break;
            }

            for (const r of reviews) {

                const reviewData = r as any;
                const reviewerEmail = reviewData.reviewer_email;

                // 1. Find Customer
                let wooCustomerId: string | null = null;
                if (reviewerEmail) {
                    const customer = await prisma.wooCustomer.findFirst({
                        where: { accountId, email: reviewerEmail }
                    });
                    if (customer) wooCustomerId = customer.id;
                }

                // 2. Find Order
                let wooOrderId: string | null = null;
                if (wooCustomerId && r.product_id) {
                    const customer = await prisma.wooCustomer.findUnique({ where: { id: wooCustomerId } });

                    if (customer) {
                        // Optimisation: Fetch orders around the review date or just recent ones.
                        // Since we don't have a direct relational link, we search for orders 
                        // created BEFORE the review date.
                        const orders = await prisma.wooOrder.findMany({
                            where: {
                                accountId,
                                dateCreated: { lte: new Date(r.date_created) }
                            },
                            orderBy: { dateCreated: 'desc' },
                            take: 50 // Check last 50 orders before review
                        });

                        // Filter in memory for customer ownership and product presence
                        const match = orders.find(o => {
                            const data = o.rawData as any;
                            // Check if order belongs to customer (by ID or Email)
                            const isCustomerOrder = (data.customer_id === customer.wooId) || (data.billing?.email === customer.email);

                            if (!isCustomerOrder) return false;

                            const items = data.line_items;
                            return Array.isArray(items) && items.some((i: any) => i.product_id === r.product_id);
                        });

                        if (match) wooOrderId = match.id;
                    }
                }

                const existingReview = await prisma.wooReview.findUnique({
                    where: { accountId_wooId: { accountId, wooId: r.id } }
                });

                await prisma.wooReview.upsert({
                    where: { accountId_wooId: { accountId, wooId: r.id } },
                    update: {
                        status: r.status,
                        content: r.review,
                        rating: r.rating,
                        rawData: r as any,
                        reviewerEmail: reviewerEmail || null,
                        wooCustomerId,
                        wooOrderId
                    },
                    create: {
                        accountId,
                        wooId: r.id,
                        productId: r.product_id,
                        productName: r.product_name,
                        reviewer: r.reviewer,
                        rating: r.rating,
                        content: r.review,
                        status: r.status,
                        dateCreated: new Date(r.date_created),
                        rawData: r as any,
                        reviewerEmail: reviewerEmail || null,
                        wooCustomerId,
                        wooOrderId
                    }
                });

                // Emit Event
                EventBus.emit(EVENTS.REVIEW.SYNCED, { accountId, review: r });

                // Detect "Review Left" for triggers
                const reviewDate = new Date(r.date_created);
                const isRecent = (new Date().getTime() - reviewDate.getTime()) < 24 * 60 * 60 * 1000;

                if (isRecent && !existingReview) {
                    EventBus.emit(EVENTS.REVIEW.LEFT, { accountId, review: r });
                }

                // Index into Elasticsearch
                // Index into Elasticsearch
                try {
                    await IndexingService.indexReview(accountId, r);
                } catch (error: any) {
                    Logger.warn(`Failed to index review ${r.id}`, { accountId, error: error.message });
                }

                totalProcessed++;
            }

            Logger.info(`Synced batch of ${reviews.length} reviews`, { accountId, page, totalPages });
            if (reviews.length < 50) hasMore = false;

            if (job) {
                const progress = totalPages > 0 ? Math.round((page / totalPages) * 100) : 100;
                await job.updateProgress(progress);
                if (!(await job.isActive())) throw new Error('Cancelled');
            }

            page++;
        }

        Logger.info(`Review Sync Complete. Total: ${totalProcessed}`, { accountId });
    }
}
