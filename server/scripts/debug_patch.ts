import { PrismaClient } from '@prisma/client';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
    // Find the localhost account
    const accounts = await prisma.account.findMany();
    const account = accounts.find(a => a.wooUrl.includes('localhost') || a.wooUrl.includes('127.0.0.1'));
    if (!account) return console.log("No localhost account found");

    const api = new WooCommerceRestApi({
        url: account.wooUrl,
        consumerKey: account.wooConsumerKey,
        consumerSecret: account.wooConsumerSecret,
        version: "wc/v3",
        queryStringAuth: true
    });

    (api as any)._request = async function (method: string, endpoint: string, data: any) {
        console.log(`[Patch] Intercepted request to ${endpoint}`);
        console.log("[Patch] Keys of THIS:", Object.keys(this));

        if ((this as any).axios) {
            console.log("[Patch] FOUND AXIOS on 'this.axios'");
        } else {
            console.log("[Patch] 'axios' NOT found on keys.");
        }

        throw new Error("Introspection complete");
    };

    console.log("Patch installed. Running...");
    try {
        await api.get("system_status");
    } catch (e: any) {
        console.log("Result:", e.message);
    }
}

main().finally(() => prisma.$disconnect());
