
import { createPrismaClient } from '../../utils/prisma';
import https from 'https';

const prisma = createPrismaClient();

// Custom fetch with HTTPS agent for debug purposes
async function fetchWithAgent(url: string, agent: https.Agent): Promise<Response> {
    // Node.js native fetch doesn't support custom agents directly,
    // so we use the https module for this debug script
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options: https.RequestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            agent,
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode || 0,
                    json: () => Promise.resolve(JSON.parse(data)),
                } as unknown as Response);
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    const log = await prisma.syncLog.findFirst({
        where: { status: 'FAILED' },
        include: { account: true }
    });

    if (!log || !log.account) {
        console.log("No failed log found with account.");
        return;
    }

    const { wooUrl, wooConsumerKey, wooConsumerSecret } = log.account;
    console.log(`Testing connection to: ${wooUrl}`);

    const agent = new https.Agent({
        rejectUnauthorized: false
    });

    const testUrl = `${wooUrl}/wp-json/wc/v3/system_status?consumer_key=${wooConsumerKey}&consumer_secret=${wooConsumerSecret}`;

    try {
        const response = await fetchWithAgent(testUrl, agent);
        console.log("Success:", response.status);
    } catch (error: any) {
        console.error("Standard Agent connection failed:", error.message);
        if (error.code) console.error("Code:", error.code);
    }

    // Try with custom options if first fails
    console.log("\n--- Retrying with common fixes ---");

    // Fix 1: Set servername manually (sometimes helps if SNI is wrong)
    const url = new URL(wooUrl!);
    const agent2 = new https.Agent({
        rejectUnauthorized: false,
        servername: url.hostname // Explicitly set SNI
    });

    try {
        console.log("Attempt 2: Explicit servername");
        await fetchWithAgent(testUrl, agent2);
        console.log("Success with explicit servername!");
    } catch (e: any) { console.log("Failed 2:", e.message); }

    // Fix 3: No SNI? (rarely supported by modern servers but worth a shot if 112)
    // Actually we can't easily disable SNI in agent options without internal hacks or IP usage.
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
