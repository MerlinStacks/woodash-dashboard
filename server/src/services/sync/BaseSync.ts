import { prisma } from '../../utils/prisma';
import { WooService } from '../woo';
import { Logger } from '../../utils/logger';
import { SyncJobData } from '../queue/SyncQueue';
import { randomUUID } from 'crypto';

/** Result returned from sync operations for observability */
export interface SyncResult {
    itemsProcessed: number;
    itemsDeleted?: number;
}

/**
 * Emit sync status via Socket.IO if available.
 * Uses dynamic import to avoid circular dependencies.
 */
async function emitSyncEvent(event: string, data: any) {
    try {
        const { getIO } = await import('../../socket');
        const io = getIO();
        if (io) {
            io.to(`account:${data.accountId}`).emit(event, data);
        }
    } catch {
        // Socket not initialized yet (startup) - ignore
    }
}

export abstract class BaseSync {

    protected abstract entityType: string;

    async perform(jobData: SyncJobData, job?: any): Promise<void> {
        const { accountId, incremental } = jobData;
        const syncId = randomUUID().slice(0, 8); // Short correlation ID

        Logger.info(`Starting ${this.entityType} sync`, { accountId, incremental, syncId });

        // Emit sync started event
        await emitSyncEvent('sync:started', { accountId, type: this.entityType, syncId });

        const log = await this.createLog(accountId, this.entityType);

        try {
            const woo = await WooService.forAccount(accountId);
            const result = await this.sync(woo, accountId, incremental || false, job, syncId);

            await this.updateLog(log.id, 'SUCCESS', undefined, result.itemsProcessed);
            await this.updateState(accountId, this.entityType);

            Logger.info(`Sync Complete: ${this.entityType}`, {
                accountId,
                syncId,
                itemsProcessed: result.itemsProcessed,
                itemsDeleted: result.itemsDeleted || 0
            });

            // Emit sync completed event
            await emitSyncEvent('sync:completed', {
                accountId,
                type: this.entityType,
                syncId,
                itemsProcessed: result.itemsProcessed,
                status: 'SUCCESS'
            });

        } catch (error: any) {
            Logger.error(`Sync Failed: ${this.entityType}`, { accountId, syncId, error: error.message });
            await this.updateLog(log.id, 'FAILED', error.message);

            // Emit sync failed event
            await emitSyncEvent('sync:completed', {
                accountId,
                type: this.entityType,
                syncId,
                status: 'FAILED',
                error: error.message
            });

            throw error; // Bubble up to BullMQ for retry
        }
    }

    protected abstract sync(woo: WooService, accountId: string, incremental: boolean, job?: any, syncId?: string): Promise<SyncResult>;

    // --- Helpers ---

    private async createLog(accountId: string, type: string) {
        return prisma.syncLog.create({
            data: { accountId, entityType: type, status: 'IN_PROGRESS' }
        });
    }

    private async updateLog(logId: string, status: 'SUCCESS' | 'FAILED', error?: string, itemsProcessed?: number) {
        await prisma.syncLog.update({
            where: { id: logId },
            data: {
                status,
                errorMessage: error,
                completedAt: new Date(),
                itemsProcessed: itemsProcessed || 0
            }
        });
    }

    protected async updateState(accountId: string, type: string) {
        await prisma.syncState.upsert({
            where: { accountId_entityType: { accountId, entityType: type } },
            update: { lastSyncedAt: new Date(), updatedAt: new Date() },
            create: { accountId, entityType: type, lastSyncedAt: new Date() }
        });
    }

    protected async getLastSync(accountId: string): Promise<string | undefined> {
        const state = await prisma.syncState.findUnique({
            where: { accountId_entityType: { accountId, entityType: this.entityType } }
        });
        if (!state?.lastSyncedAt) return undefined;

        // Add 5-minute buffer for incremental syncs to handle clock skew/API delays
        const bufferedDate = new Date(state.lastSyncedAt.getTime() - 5 * 60 * 1000);
        return bufferedDate.toISOString();
    }
}
