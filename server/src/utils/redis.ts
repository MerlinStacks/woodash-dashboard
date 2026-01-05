import Redis from 'ioredis';
import { Logger } from './logger';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

class RedisConnection {
    private static instance: Redis;

    public static getInstance(): Redis {
        if (!RedisConnection.instance) {
            Logger.info('Initializing Redis Connection...');
            RedisConnection.instance = new Redis({
                host: REDIS_HOST,
                port: REDIS_PORT,
                maxRetriesPerRequest: null, // Critical for BullMQ
            });

            RedisConnection.instance.on('connect', () => {
                Logger.info('Redis Connected Successfully');
            });

            RedisConnection.instance.on('error', (err) => {
                Logger.error('Redis Connection Error', { error: err.message });
            });
        }

        return RedisConnection.instance;
    }

    public static async close(): Promise<void> {
        if (RedisConnection.instance) {
            await RedisConnection.instance.quit();
            Logger.info('Redis Connection Closed');
        }
    }
}

export const redisClient = RedisConnection.getInstance();
