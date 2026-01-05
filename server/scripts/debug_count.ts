import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Load env vars FIRST
const envPath = path.join(__dirname, '../.env');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

console.log('ELASTICSEARCH_URL:', process.env.ELASTICSEARCH_URL);

// 2. Import client AFTER env is loaded
async function run() {
    try {
        const { esClient } = await import('../src/utils/elastic');

        console.log('Connecting to ES...');

        // Query WITHOUT track_total_hits
        const defaultRes = await esClient.search({
            index: 'customers',
            body: {
                query: { match_all: {} },
                size: 0
            }
        });
        console.log('--- Default Behavior ---');
        console.log('Total hits object:', JSON.stringify(defaultRes.hits.total));

        // Query WITH track_total_hits: true
        const trackedRes = await esClient.search({
            index: 'customers',
            body: {
                query: { match_all: {} },
                size: 0,
                track_total_hits: true
            }
        });
        console.log('--- With track_total_hits: true ---');
        console.log('Total hits object:', JSON.stringify(trackedRes.hits.total));

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
