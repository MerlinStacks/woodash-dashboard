import { Queue, Worker } from 'bullmq';
import { redisClient } from '../../utils/redis';
import { Logger } from '../../utils/logger';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';

// Define Queue Names
export const QUEUES = {
    ORDERS: 'sync-orders',
    PRODUCTS: 'sync-products',
    REVIEWS: 'sync-reviews',
    CUSTOMERS: 'sync-customers',
    REPORTS: 'report-generation',
};

// Global Store for Queues to adapter
const queues = new Map<string, Queue>();

export class QueueFactory {

    static init() {
        // Initialize all known queues to ensure they appear in Bull Board
        Object.values(QUEUES).forEach(name => this.getQueue(name));
        this.getQueue('scheduler');
    }

    static getQueue(name: string) {
        if (queues.has(name)) {
            return queues.get(name)!;
        }

        const queue = new Queue(name, {
            connection: redisClient as any,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: { count: 100 },    // Keep last 100 completed
                removeOnFail: { age: 86400 },        // Remove failed after 24 hours (prevents bloat)
            },
        });

        queues.set(name, queue);
        return queue;
    }

    // Alias for compatibility
    static createQueue(name: string) {
        return this.getQueue(name);
    }

    static createWorker(name: string, processor: (job: any) => Promise<void>) {
        const worker = new Worker(name, async (job) => {
            Logger.info(`Processing Job ${job.id}`, { jobId: job.id, accountId: job.data.accountId });
            await processor(job);
        }, {
            connection: redisClient.duplicate() as any,
            concurrency: 5, // Can perform 5 syncs in parallel per queue type
        });

        worker.on('completed', (job) => {
            Logger.info(`Job ${job.id} Completed`);
        });

        worker.on('failed', (job, err) => {
            Logger.error(`Job ${job?.id} Failed`, { error: err.message });
        });

        return worker;
    }

    // Bull Board Setup
    static createBoard() {
        const serverAdapter = new FastifyAdapter();
        serverAdapter.setBasePath('/admin/queues');

        createBullBoard({
            queues: Array.from(queues.values()).map(q => new BullMQAdapter(q)) as any,
            serverAdapter: serverAdapter as any,
        });

        return serverAdapter;
    }
}
