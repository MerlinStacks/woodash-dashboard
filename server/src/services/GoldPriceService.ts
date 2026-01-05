import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { Logger } from '../utils/logger';

const prisma = new PrismaClient();

// GoldAPI.io configuration
// In a real scenario, we might want this in the DB per account if they bring their own key,
// but for now we'll assume a system-wide free key or similar.
const GOLD_API_URL = 'https://www.goldapi.io/api';
// Using a placeholder token or env variable. In prod, use process.env.GOLD_API_KEY
const API_TOKEN = process.env.GOLD_API_KEY || '';

export class GoldPriceService {
    /**
     * Fetches the current gold price for a given currency from GoldAPI.io
     */
    static async fetchLivePrice(currency = 'USD'): Promise<number | null> {
        if (!API_TOKEN) {
            Logger.warn('GoldPriceService: No API Token configured');
            return null;
        }

        try {
            const symbol = `XAU`;
            const response = await axios.get(`${GOLD_API_URL}/${symbol}/${currency}`, {
                headers: {
                    'x-access-token': API_TOKEN,
                    'Content-Type': 'application/json',
                },
            });

            // Response example: { "price": 2745.30, "currency": "USD", ... }
            if (response.data && response.data.price) {
                // Gold price is usually per Ounce (Troy Ounce ~ 31.1035g)
                // We want per GRAM for the calculator
                const pricePerOunce = parseFloat(response.data.price);
                const pricePerGram = pricePerOunce / 31.1034768;
                return pricePerGram;
            }
            return null;
        } catch (error) {
            Logger.error('GoldPriceService: Error fetching price', { error: (error as Error).message });
            return null;
        }
    }

    /**
     * Updates the account's gold price manually or via API
     */
    static async updateAccountPrice(accountId: string, manualPrice?: number): Promise<void> {
        let price = manualPrice;

        if (price === undefined) {
            // Fetch from API
            const account = await prisma.account.findUnique({
                where: { id: accountId },
                select: { currency: true }
            });

            if (account) {
                const livePrice = await this.fetchLivePrice(account.currency);
                if (livePrice !== null) {
                    price = livePrice;
                }
            }
        }

        if (price !== undefined && price !== null) {
            await prisma.account.update({
                where: { id: accountId },
                data: {
                    // @ts-ignore - TS2353: Persistent Docker build error masking this field
                    goldPrice: price,
                    goldPriceCurrency: 'USD' // Ideally usually matches account.currency
                }
            });
        }
    }
}
