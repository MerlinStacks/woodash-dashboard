/**
 * Google Ads Service
 * Handles Google Ads API v17 interactions for ad insights.
 */

import { prisma } from '../../utils/prisma';
import { Logger } from '../../utils/logger';
import { GoogleAdsApi } from 'google-ads-api';
import { AdMetric, CampaignInsight, DailyTrend, ShoppingProductInsight, getCredentials, formatDateISO, formatDateGAQL } from './types';

/**
 * Service for Google Ads integration.
 * Uses Google Ads API v17 with GAQL queries.
 */
export class GoogleAdsService {

    /**
     * Fetch Google Ads insights for the last 30 days.
     * Uses GAQL to query cost, impressions, clicks, and conversion value.
     */
    static async getInsights(adAccountId: string): Promise<AdMetric | null> {
        const adAccount = await prisma.adAccount.findUnique({
            where: { id: adAccountId }
        });

        if (!adAccount || adAccount.platform !== 'GOOGLE' || !adAccount.refreshToken || !adAccount.externalId) {
            throw new Error('Invalid Google Ad Account');
        }

        // Get Google Ads credentials from database (with env fallback)
        const creds = await getCredentials('GOOGLE_ADS');
        if (!creds?.clientId || !creds?.clientSecret || !creds?.developerToken) {
            Logger.warn('Google Ads credentials not configured. Configure via Super Admin.');
            return null;
        }

        const { clientId, clientSecret, developerToken } = creds;

        try {
            const client = new GoogleAdsApi({
                client_id: clientId,
                client_secret: clientSecret,
                developer_token: developerToken
            });

            // For Manager (MCC) accounts, we need to specify login_customer_id
            const loginCustomerId = creds.loginCustomerId; // Optional: MCC account ID

            const customerConfig: any = {
                customer_id: adAccount.externalId.replace(/-/g, ''),
                refresh_token: adAccount.refreshToken
            };

            // If accessing through an MCC, add the login_customer_id
            if (loginCustomerId) {
                customerConfig.login_customer_id = loginCustomerId.replace(/-/g, '');
            }

            const customer = client.Customer(customerConfig);

            // Calculate date range for last 30 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            // GAQL query for account-level metrics
            const query = `
                SELECT
                    metrics.cost_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.conversions_value,
                    customer.currency_code
                FROM customer
                WHERE segments.date BETWEEN '${formatDateGAQL(startDate)}' AND '${formatDateGAQL(endDate)}'
            `;

            const [response] = await customer.query(query);

            if (!response || !response.metrics) {
                return null;
            }

            // Google Ads returns cost in micros (1/1,000,000 of currency unit)
            const spend = (response.metrics.cost_micros || 0) / 1_000_000;
            const conversionsValue = response.metrics.conversions_value || 0;
            const roas = spend > 0 ? conversionsValue / spend : 0;

            return {
                accountId: adAccountId,
                spend,
                impressions: response.metrics.impressions || 0,
                clicks: response.metrics.clicks || 0,
                roas,
                currency: response.customer?.currency_code || adAccount.currency || 'USD',
                date_start: formatDateISO(startDate),
                date_stop: formatDateISO(endDate)
            };

        } catch (error: any) {
            // Parse Google Ads API specific errors for better diagnostics
            const errorMessage = error.message || '';
            const errorCode = error.code;

            let userFriendlyMessage = errorMessage;

            // GRPC error code 12 = UNIMPLEMENTED
            if (errorCode === 12 || errorMessage.includes('UNIMPLEMENTED') || errorMessage.includes('GRPC target method')) {
                userFriendlyMessage = 'Google Ads API access denied. Possible causes: ' +
                    '(1) Developer token at "Test Account" level - upgrade to "Explorer Access" at https://ads.google.com/aw/apicenter. ' +
                    '(2) Missing Manager Account ID (MCC) - if accessing client accounts through an MCC, add the Manager Account ID in Super Admin > Credentials > Google Ads.';
            }
            // GRPC error code 7 = PERMISSION_DENIED
            else if (errorCode === 7 || errorMessage.includes('PERMISSION_DENIED')) {
                userFriendlyMessage = 'Permission denied. Ensure the connected Google account has access to this Google Ads account (Customer ID: ' +
                    adAccount.externalId + '). The user must be linked to this account in Google Ads.';
            }
            // GRPC error code 16 = UNAUTHENTICATED
            else if (errorCode === 16 || errorMessage.includes('UNAUTHENTICATED') || errorMessage.includes('invalid_grant')) {
                userFriendlyMessage = 'Authentication expired. Please disconnect and reconnect your Google Ads account to refresh the OAuth tokens.';
            }
            // Invalid customer ID format
            else if (errorMessage.includes('INVALID_CUSTOMER_ID') || errorMessage.includes('customer_id')) {
                userFriendlyMessage = 'Invalid Customer ID format. Please verify the Customer ID is correct (format: 123-456-7890 or 1234567890).';
            }

            Logger.error('Failed to fetch Google Ads Insights', {
                error: errorMessage,
                code: errorCode,
                adAccountId,
                customerId: adAccount.externalId,
                userMessage: userFriendlyMessage
            });

            throw new Error(userFriendlyMessage);
        }
    }

    /**
     * Fetch Google Ads campaign-level insights for the last 30 days.
     * Returns detailed metrics for each campaign including spend, ROAS, CTR, CPC, CPA.
     */
    static async getCampaignInsights(adAccountId: string, days: number = 30): Promise<CampaignInsight[]> {
        const adAccount = await prisma.adAccount.findUnique({
            where: { id: adAccountId }
        });

        if (!adAccount || adAccount.platform !== 'GOOGLE' || !adAccount.refreshToken || !adAccount.externalId) {
            throw new Error('Invalid Google Ad Account');
        }

        const creds = await getCredentials('GOOGLE_ADS');
        if (!creds?.clientId || !creds?.clientSecret || !creds?.developerToken) {
            Logger.warn('Google Ads credentials not configured.');
            return [];
        }

        const { clientId, clientSecret, developerToken } = creds;

        try {
            const client = new GoogleAdsApi({
                client_id: clientId,
                client_secret: clientSecret,
                developer_token: developerToken
            });

            const loginCustomerId = creds.loginCustomerId;
            const customerConfig: any = {
                customer_id: adAccount.externalId.replace(/-/g, ''),
                refresh_token: adAccount.refreshToken
            };
            if (loginCustomerId) {
                customerConfig.login_customer_id = loginCustomerId.replace(/-/g, '');
            }

            const customer = client.Customer(customerConfig);

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // GAQL query for campaign-level metrics - only ENABLED campaigns
            const query = `
                SELECT
                    campaign.id,
                    campaign.name,
                    campaign.status,
                    metrics.cost_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.conversions,
                    metrics.conversions_value
                FROM campaign
                WHERE segments.date BETWEEN '${formatDateGAQL(startDate)}' AND '${formatDateGAQL(endDate)}'
                    AND campaign.status = 'ENABLED'
                ORDER BY metrics.cost_micros DESC
            `;

            const results = await customer.query(query);

            const campaigns: CampaignInsight[] = results.map((row: any) => {
                const spend = (row.metrics?.cost_micros || 0) / 1_000_000;
                const impressions = row.metrics?.impressions || 0;
                const clicks = row.metrics?.clicks || 0;
                const conversions = row.metrics?.conversions || 0;
                const conversionsValue = row.metrics?.conversions_value || 0;

                return {
                    campaignId: row.campaign?.id?.toString() || '',
                    campaignName: row.campaign?.name || 'Unknown',
                    status: row.campaign?.status || 'UNKNOWN',
                    spend,
                    impressions,
                    clicks,
                    conversions,
                    conversionsValue,
                    roas: spend > 0 ? conversionsValue / spend : 0,
                    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                    cpc: clicks > 0 ? spend / clicks : 0,
                    cpa: conversions > 0 ? spend / conversions : 0,
                    currency: adAccount.currency || 'USD',
                    dateStart: formatDateISO(startDate),
                    dateStop: formatDateISO(endDate)
                };
            });

            return campaigns;

        } catch (error: any) {
            Logger.error('Failed to fetch Google Ads Campaign Insights', {
                error: error.message,
                adAccountId
            });
            throw error;
        }
    }

    /**
     * Fetch daily performance trends for a Google Ads account.
     * Returns spend, impressions, clicks, conversions per day.
     */
    static async getDailyTrends(adAccountId: string, days: number = 30): Promise<DailyTrend[]> {
        const adAccount = await prisma.adAccount.findUnique({
            where: { id: adAccountId }
        });

        if (!adAccount || adAccount.platform !== 'GOOGLE' || !adAccount.refreshToken || !adAccount.externalId) {
            throw new Error('Invalid Google Ad Account');
        }

        const creds = await getCredentials('GOOGLE_ADS');
        if (!creds?.clientId || !creds?.clientSecret || !creds?.developerToken) {
            return [];
        }

        const { clientId, clientSecret, developerToken } = creds;

        try {
            const client = new GoogleAdsApi({
                client_id: clientId,
                client_secret: clientSecret,
                developer_token: developerToken
            });

            const loginCustomerId = creds.loginCustomerId;
            const customerConfig: any = {
                customer_id: adAccount.externalId.replace(/-/g, ''),
                refresh_token: adAccount.refreshToken
            };
            if (loginCustomerId) {
                customerConfig.login_customer_id = loginCustomerId.replace(/-/g, '');
            }

            const customer = client.Customer(customerConfig);

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // GAQL query for daily metrics
            const query = `
                SELECT
                    segments.date,
                    metrics.cost_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.conversions,
                    metrics.conversions_value
                FROM customer
                WHERE segments.date BETWEEN '${formatDateGAQL(startDate)}' AND '${formatDateGAQL(endDate)}'
                ORDER BY segments.date ASC
            `;

            const results = await customer.query(query);

            return results.map((row: any) => ({
                date: row.segments?.date || '',
                spend: (row.metrics?.cost_micros || 0) / 1_000_000,
                impressions: row.metrics?.impressions || 0,
                clicks: row.metrics?.clicks || 0,
                conversions: row.metrics?.conversions || 0,
                conversionsValue: row.metrics?.conversions_value || 0
            }));

        } catch (error: any) {
            Logger.error('Failed to fetch Google Ads Daily Trends', {
                error: error.message,
                adAccountId
            });
            throw error;
        }
    }

    /**
     * Exchange Google OAuth authorization code for access/refresh tokens.
     * Called after user completes OAuth consent flow.
     */
    static async exchangeCode(
        code: string,
        redirectUri: string
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const creds = await getCredentials('GOOGLE_ADS');
        if (!creds?.clientId || !creds?.clientSecret) {
            throw new Error('Google Ads credentials not configured. Please configure via Super Admin.');
        }

        const { clientId, clientSecret } = creds;

        const tokenUrl = 'https://oauth2.googleapis.com/token';
        const params = new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });

        try {
            Logger.info('Exchanging Google OAuth code', { redirectUri, hasCode: !!code });

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            const data = await response.json();

            Logger.info('Google token exchange response', {
                hasAccessToken: !!data.access_token,
                hasRefreshToken: !!data.refresh_token,
                error: data.error,
                tokenType: data.token_type
            });

            if (data.error) {
                throw new Error(data.error_description || data.error);
            }

            if (!data.access_token) {
                throw new Error('No access token received from Google');
            }

            // Refresh token may not be returned if user previously authorized
            if (!data.refresh_token) {
                Logger.warn('No refresh token received from Google. User may need to revoke app access at https://myaccount.google.com/permissions and re-authorize.');
            }

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || ''
            };
        } catch (error) {
            Logger.error('Failed to exchange Google OAuth code', { error });
            throw error;
        }
    }

    /**
     * Get the Google OAuth authorization URL for user consent.
     */
    static async getAuthUrl(redirectUri: string, state: string): Promise<string> {
        const creds = await getCredentials('GOOGLE_ADS');
        if (!creds?.clientId) {
            throw new Error('Google Ads credentials not configured. Please configure via Super Admin.');
        }

        const { clientId } = creds;

        const scopes = [
            'https://www.googleapis.com/auth/adwords'
        ];

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent',
            state
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    /**
     * Fetch all accessible Google Ads customer accounts after OAuth.
     * Used to let user select which ad account to connect.
     */
    static async listCustomers(refreshToken: string): Promise<Array<{ id: string; name: string }>> {
        const creds = await getCredentials('GOOGLE_ADS');
        if (!creds?.clientId || !creds?.clientSecret || !creds?.developerToken) {
            throw new Error('Google Ads credentials not configured. Please configure via Super Admin.');
        }

        const { clientId, clientSecret, developerToken } = creds;

        try {
            const client = new GoogleAdsApi({
                client_id: clientId,
                client_secret: clientSecret,
                developer_token: developerToken
            });

            const response = await client.listAccessibleCustomers(refreshToken);

            // listAccessibleCustomers returns { resource_names: string[] }
            const customerResourceNames = response.resource_names || [];

            // Extract customer IDs from resource names (format: "customers/1234567890")
            const customerIds = customerResourceNames.map((rn: string) => rn.replace('customers/', ''));

            // Fetch descriptive names for each customer
            const results: Array<{ id: string; name: string }> = [];

            for (const customerId of customerIds) {
                try {
                    const customer = client.Customer({
                        customer_id: customerId.replace(/-/g, ''),
                        refresh_token: refreshToken
                    });

                    const [info] = await customer.query(`
                        SELECT customer.descriptive_name, customer.id
                        FROM customer
                        LIMIT 1
                    `);

                    results.push({
                        id: customerId,
                        name: (info as any)?.customer?.descriptive_name || `Account ${customerId}`
                    });
                } catch {
                    // Skip accounts we can't access
                    results.push({ id: customerId, name: `Account ${customerId}` });
                }
            }

            return results;
        } catch (error) {
            Logger.error('Failed to list Google Ads customers', { error });
            throw error;
        }
    }

    /**
     * Fetch Google Shopping product-level performance data.
     * Returns product performance within Shopping campaigns for AI analysis.
     * Only includes active campaigns with actual impressions, limited to top products.
     */
    static async getShoppingProducts(adAccountId: string, days: number = 30, limit: number = 200): Promise<ShoppingProductInsight[]> {
        const adAccount = await prisma.adAccount.findUnique({
            where: { id: adAccountId }
        });

        if (!adAccount || adAccount.platform !== 'GOOGLE' || !adAccount.refreshToken || !adAccount.externalId) {
            throw new Error('Invalid Google Ad Account');
        }

        const creds = await getCredentials('GOOGLE_ADS');
        if (!creds?.clientId || !creds?.clientSecret || !creds?.developerToken) {
            Logger.warn('Google Ads credentials not configured.');
            return [];
        }

        const { clientId, clientSecret, developerToken } = creds;

        try {
            const client = new GoogleAdsApi({
                client_id: clientId,
                client_secret: clientSecret,
                developer_token: developerToken
            });

            const loginCustomerId = creds.loginCustomerId;
            const customerConfig: any = {
                customer_id: adAccount.externalId.replace(/-/g, ''),
                refresh_token: adAccount.refreshToken
            };
            if (loginCustomerId) {
                customerConfig.login_customer_id = loginCustomerId.replace(/-/g, '');
            }

            const customer = client.Customer(customerConfig);

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // GAQL query for shopping product performance
            // Only active campaigns with impressions, ordered by spend
            const query = `
                SELECT
                    campaign.id,
                    campaign.name,
                    segments.product_item_id,
                    segments.product_title,
                    segments.product_brand,
                    segments.product_type_l1,
                    metrics.cost_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.conversions,
                    metrics.conversions_value
                FROM shopping_performance_view
                WHERE segments.date BETWEEN '${formatDateGAQL(startDate)}' AND '${formatDateGAQL(endDate)}'
                    AND campaign.status = 'ENABLED'
                    AND metrics.impressions > 0
                ORDER BY metrics.cost_micros DESC
                LIMIT ${limit}
            `;

            const results = await customer.query(query);

            const products: ShoppingProductInsight[] = results.map((row: any) => {
                const spend = (row.metrics?.cost_micros || 0) / 1_000_000;
                const impressions = row.metrics?.impressions || 0;
                const clicks = row.metrics?.clicks || 0;
                const conversions = row.metrics?.conversions || 0;
                const conversionsValue = row.metrics?.conversions_value || 0;

                return {
                    campaignId: row.campaign?.id?.toString() || '',
                    campaignName: row.campaign?.name || 'Unknown',
                    productId: row.segments?.product_item_id || '',
                    productTitle: row.segments?.product_title || 'Unknown Product',
                    productBrand: row.segments?.product_brand || '',
                    productCategory: row.segments?.product_type_l1 || '',
                    spend,
                    impressions,
                    clicks,
                    conversions,
                    conversionsValue,
                    roas: spend > 0 ? conversionsValue / spend : 0,
                    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                    cpc: clicks > 0 ? spend / clicks : 0,
                    currency: adAccount.currency || 'USD',
                    dateStart: formatDateISO(startDate),
                    dateStop: formatDateISO(endDate)
                };
            });

            return products;

        } catch (error: any) {
            // Handle case where account has no Shopping campaigns
            if (error.message?.includes('UNIMPLEMENTED') || error.message?.includes('not enabled')) {
                Logger.info('Shopping performance view not available for this account', { adAccountId });
                return [];
            }
            Logger.error('Failed to fetch Google Shopping Products', {
                error: error.message,
                adAccountId
            });
            throw error;
        }
    }
}
