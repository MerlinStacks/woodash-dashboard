
import { Queue } from 'bullmq';
import { redisClient } from '../src/utils/redis';

const QUEUES = ['sync-orders', 'sync-products', 'sync-customers', 'sync-reviews'];

async function clear() {
    console.log('Clearing Queues...');

    for (const name of QUEUES) {
        const queue = new Queue(name, { connection: redisClient });
        await queue.obliterate({ force: true });
        console.log(`Obliterated ${name}`);
        await queue.close();
    }

    console.log('All queues cleared.');
    process.exit(0);
}

clear().catch(console.error);
