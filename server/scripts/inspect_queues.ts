
import { Queue } from 'bullmq';
import { redisClient } from '../src/utils/redis';

const QUEUES = ['sync-orders', 'sync-products', 'sync-customers', 'sync-reviews'];

async function inspect() {
    console.log('Inspecting Queues...');

    for (const name of QUEUES) {
        const queue = new Queue(name, { connection: redisClient });
        const active = await queue.getActiveCount();
        const waiting = await queue.getWaitingCount();
        const delayed = await queue.getDelayedCount();

        console.log(`Queue: ${name.padEnd(15)} | Active: ${active} | Waiting: ${waiting} | Delayed: ${delayed}`);

        if (active > 0) {
            const jobs = await queue.getActive();
            jobs.forEach(j => console.log(`  - Job ${j.id}: ${j.progress}%`));
        }

        await queue.close();
    }

    process.exit(0);
}

inspect().catch(console.error);
