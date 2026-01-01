import axios, { AxiosInstance } from 'axios';
import https from 'https';

export type AuthMethod = 'basic' | 'query_string';

export const createClient = (storeUrl: string, consumerKey: string, consumerSecret: string, method: AuthMethod): AxiosInstance => {
    let cleanUrl = storeUrl.replace(/\/$/, '').replace(/\/wp-json\/?$/, '');

    const config: any = {
        baseURL: `${cleanUrl}/wp-json/wc/v3`,
        timeout: 120000,
        headers: {
            'User-Agent': 'OverSeek-Sync-Agent/1.0',
            'Accept': 'application/json'
        },
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    };

    if (method === 'query_string') {
        config.params = { consumer_key: consumerKey, consumer_secret: consumerSecret };
        config.auth = undefined;
    } else {
        // Basic Auth
        config.headers['Authorization'] = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    }
    return axios.create(config);
};

export const detectAuth = async (storeUrl: string, consumerKey: string, consumerSecret: string, preferredMethod?: AuthMethod): Promise<AxiosInstance> => {
    if (preferredMethod === 'query_string') return createClient(storeUrl, consumerKey, consumerSecret, 'query_string');
    if (preferredMethod === 'basic') return createClient(storeUrl, consumerKey, consumerSecret, 'basic');

    try {
        const client = createClient(storeUrl, consumerKey, consumerSecret, 'basic');
        await client.get('/products', { params: { per_page: 1 } });
        return client;
    } catch (e1: any) {
        try {
            const client = createClient(storeUrl, consumerKey, consumerSecret, 'query_string');
            await client.get('/products', { params: { per_page: 1 } });
            return client;
        } catch (e2: any) {
            throw new Error(`Auth Failed: Basic (${e1.message}) & Query String (${e2.message})`);
        }
    }
};
