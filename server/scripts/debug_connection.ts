import { PrismaClient } from '@prisma/client';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const prisma = new PrismaClient();

async function main() {
    // Find the localhost account
    const accounts = await prisma.account.findMany();
    const account = accounts.find(a => a.wooUrl.includes('localhost') || a.wooUrl.includes('127.0.0.1'));

    if (!account) {
        console.log("No localhost account found to test.");
        return;
    }

    console.log(`Testing connection for: ${account.wooUrl}`);

    const api = new WooCommerceRestApi({
        url: account.wooUrl,
        consumerKey: account.wooConsumerKey,
        consumerSecret: account.wooConsumerSecret,
        version: "wc/v3",
        queryStringAuth: true
    });

    console.log("API Keys:", Object.keys(api));
    // Also try checking prototype or internal fields if possible
    console.log("Internal Axios?", (api as any).axios);
    console.log("Internal _request?", (api as any)._request);

    // Safe stringify to avoid circular deps
    const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key: any, value: any) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
            }
            return value;
        };
    };

    console.log("FULL API OBJECT:", JSON.stringify(api, getCircularReplacer(), 2));

    // Check hidden properties
    console.log("Descriptor:", Object.getOwnPropertyNames(api));
    console.log("Proto:", Object.getOwnPropertyNames(Object.getPrototypeOf(api)));
}

main().finally(() => prisma.$disconnect());
