import { QueueFactory, QUEUES } from './queue/QueueFactory';
import { Logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

import { AutomationEngine } from './AutomationEngine';

const prisma = new PrismaClient();
const automationEngine = new AutomationEngine();

export class SchedulerService {

    // Start all scheduled tasks
    static async start() {
        Logger.info('Starting Scheduler Service...');


        await this.scheduleSyncAll();

        // Start Tickers (Legacy setIntervals, moving to workers later?)
        // For now, run them here to keep index.ts clean.
        this.startTickers();
    }

    private static startTickers() {
        Logger.info('Starting Automation Tickers...');

        // Review Automation


        // Marketing Automation
        setInterval(() => {
            automationEngine.runTicker().catch(e => Logger.error('Marketing Ticker Error', { error: e }));
        }, 60 * 1000); // 1 Min

        // Email Polling (Check every 2 minutes)
        setInterval(async () => {
            try {
                const accounts = await prisma.emailAccount.findMany({ where: { type: 'IMAP' } });
                if (accounts.length > 0) {
                    const { EmailService } = await import('./EmailService');
                    const emailService = new EmailService();
                    for (const acc of accounts) {
                        await emailService.checkEmails(acc.id);
                    }
                }
            } catch (error) {
                Logger.error('Email Polling Error', { error });
            }
        }, 2 * 60 * 1000);
    }

    private static async scheduleSyncAll() {
        // We want to sync ALL accounts every X minutes?
        // Or better: Iterate all accounts and queue them?
        // BullMQ repeatable job usually adds ONE job that repeats.
        // If we want to sync all accounts, we need a "Master Job" that finds accounts and spawns child jobs.

        const queue = QueueFactory.createQueue('scheduler'); // Dedicated queue

        /*
            Master Job: "Sync Orchestrator"
            Runs every 15 minutes.
            Fetches all accounts and dispatches 'runSync' for each.
        */

        await queue.add('orchestrate-sync', {}, {
            repeat: {
                pattern: '*/15 * * * *', // Every 15 mins
            },
            jobId: 'orchestrator' // Singleton
        });

        QueueFactory.createWorker('scheduler', async (job) => {
            if (job.name === 'orchestrate-sync') {
                await this.dispatchToAllAccounts();
            }
        });

        Logger.info('Scheduled Global Sync Orchestrator (Every 15 mins)');
    }

    private static async dispatchToAllAccounts() {
        const accounts = await prisma.account.findMany({ select: { id: true } });
        Logger.info(`Orchestrator: Dispatching sync for ${accounts.length} accounts`);

        // We import SyncService here to avoid circular dep issues at top level if any, 
        // but facade is clean.
        const { SyncService } = await import('./sync');
        const service = new SyncService();

        for (const acc of accounts) {
            // Use SyncService with Low Priority (1)
            // This ensures we use the same Job ID Logic (sync_orders_ACCID) and Duplicate Prevention.
            // If a Manual Sync (Prio 10) is active, this request will be skipped by SyncService.
            // If no job active, this will start with Prio 1.
            await service.runSync(acc.id, {
                incremental: true,
                priority: 1
            });
        }
    }
}
