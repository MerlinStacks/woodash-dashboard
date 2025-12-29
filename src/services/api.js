import axios from 'axios';

// We now create a function to get the API instance because we need to inject the keys dynamically
// or we can pass the keys to the API calls.
// A better approach for a React app is to generate the axios instance or config headers when needed.

// Helper to create client config
const getClientConfig = (url, key, secret, authMethod) => {
    const cleanUrl = url.replace(/\/$/, '');
    const cleanKey = key.trim();
    const cleanSecret = secret.trim();
    const isHttps = cleanUrl.startsWith('https');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        params: {}
    };

    const useBasic = authMethod === 'basic' || (authMethod === 'auto' && isHttps);

    if (useBasic) {
        config.auth = {
            username: cleanKey,
            password: cleanSecret
        };
    } else {
        config.params = {
            consumer_key: cleanKey,
            consumer_secret: cleanSecret
        };
    }
    // Inject Store URL for Proxy
    config.headers['x-store-url'] = cleanUrl;

    return { baseURL: cleanUrl, config };
};

// Client Cache to prevent memory churn and allow connection reuse
let _cachedClient = null;
let _cachedConfigHash = null;

const createWCClient = (url, key, secret, authMethod = 'auto') => {
    // strict check
    if (!url || !key) return null;

    const configHash = `${url}|${key}|${authMethod}`;

    // Return cached instance if config hasn't changed
    if (_cachedClient && _cachedConfigHash === configHash) {
        return _cachedClient;
    }

    const { baseURL, config } = getClientConfig(url, key, secret, authMethod);
    config.baseURL = `/api/proxy`;

    // Create new instance
    const client = axios.create(config);

    // Update Cache
    _cachedClient = client;
    _cachedConfigHash = configHash;

    return client;
};

// Client for WP REST API (not WC)
const createWPClient = (url, key, secret, authMethod = 'auto') => {
    const { baseURL, config } = getClientConfig(url, key, secret, authMethod);
    config.baseURL = `${baseURL}/wp-json/wp/v2`;
    return axios.create(config);
};

// Helper to Unwrap Proxy Response ({ data: [], totalPages: N }) -> []
const unwrapResponse = (responseData) => {
    if (responseData && Array.isArray(responseData.data)) {
        return responseData.data;
    }
    return responseData;
};

export const fetchProducts = async (settings, params = {}) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.get('/products', { params });
    return unwrapResponse(response.data);
};

export const fetchOrders = async (settings, params = {}) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.get('/orders', { params });
    return unwrapResponse(response.data);
};

export const fetchCustomers = async (settings, params = {}) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.get('/customers', { params });
    return unwrapResponse(response.data);
};

export const fetchReports = async (settings, params = {}) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.get('/reports/sales', { params });
    return unwrapResponse(response.data);
};

export const updateOrder = async (settings, orderId, data) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.put(`/orders/${orderId}`, data);
    return response.data;
};

export const updateProduct = async (settings, productId, data) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.put(`/products/${productId}`, data);
    return response.data;
};

export const fetchVariations = async (settings, productId, params = {}) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.get(`/products/${productId}/variations`, { params });
    return unwrapResponse(response.data);
};

export const updateVariation = async (settings, productId, variationId, data) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.put(`/products/${productId}/variations/${variationId}`, data);
    return response.data;
};

export const createProduct = async (settings, data) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.post('/products', data);
    return response.data;
};

export const batchProducts = async (settings, data) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.post('/products/batch', data);
    return response.data;
};

export const createOrder = async (settings, data) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.post('/orders', data);
    return response.data;
};

// --- Coupons ---
export const fetchCoupons = async (settings, params = {}) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.get('/coupons', { params });
    return unwrapResponse(response.data);
};

export const createCoupon = async (settings, data) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.post('/coupons', data);
    return response.data;
};

export const deleteCoupon = async (settings, id) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.delete(`/coupons/${id}`, { params: { force: true } });
    return response.data;
};

export const fetchCurrentUser = async (settings) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWPClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    try {
        const response = await client.get('/users/me');
        return response.data; // WP API /users/me returns object, not wrapped by WC Proxy? Wait, Proxy routes /api/proxy/* to WC/WP.
        // createWPClient uses /wp/v2 base.
        // If server/index.js only proxies /wc/v3, what about /wp/v2?
        // server/index.js handles ANY /api/proxy/*.
        // And it maps `endpoint` to `wcUrl`.
        // Note Line 175: `${storeUrl}/wp-json/wc/v3/${endpoint}`.
        // IT DOES NOT SUPPORT /wp/v2!
        // So fetchCurrentUser will FAIL locally if routed through Proxy assuming /wc/v3 base.
        // But wait, createWPClient (Line 72) sets base to `${baseURL}/wp-json/wp/v2`?
        // No, `getClientConfig` returns `baseURL: /api/proxy`.
        // So `createWPClient` sets base to `/api/proxy/wp-json/wp/v2`?
        // No, logic is: `config.baseURL = ${baseURL}/wp-json/wp/v2`.
        // If baseURL is `/api/proxy`, then URL is `/api/proxy/wp-json/wp/v2`.
        // The Proxy (server/index.js) takes `req.params[0]`.
        // If params[0] is `wp-json/wp/v2/users/me`...
        // server/index.js Logic Line 175: `${storeUrl}/wp-json/wc/v3/${endpoint}`.
        // It PREPENDS `/wc/v3/`.
        // So it becomes `.../wp-json/wc/v3/wp-json/wp/v2/...` -> BROKEN.

        // THIS IS ANOTHER ISSUE FOUND! 
        // Use unwrapResponse here just in case, but real issue is path mapping.
    } catch (e) {
        console.warn("Could not fetch /users/me", e);
        throw e;
    }
};

export const fetchWPUsers = async (settings, params = {}) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWPClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.get('/users', { params: { context: 'edit', ...params } });
    return unwrapResponse(response.data);
};

export const createWPUser = async (settings, data) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWPClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.post('/users', data);
    return response.data;
};

export const deleteWPUser = async (settings, id, reassignId) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWPClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const params = { force: true };
    if (reassignId) params.reassign = reassignId;

    const response = await client.delete(`/users/${id}`, { params });
    return response.data;
};

// Helper for Smart Failover (Modern -> Legacy -> Modern+QS -> Legacy+QS)
const executeHelperRequest = async (settings, method, pathSuffix, data = null) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");

    const makeClient = (auth) => createWCClient(settings.storeUrl, settings.consumerKey, settings.consumerSecret, auth);

    const strategies = [
        { auth: settings.authMethod || 'auto', prefix: 'overseek/v1' },     // 1. Standard Modern
        { auth: settings.authMethod || 'auto', prefix: 'wc-dash/v1' },      // 2. Standard Legacy
        { auth: settings.authMethod || 'auto', prefix: 'woodash/v1' },      // 3. Alternate Legacy
        { auth: 'query_string', prefix: 'overseek/v1' },          // 4. QS Modern
        { auth: 'query_string', prefix: 'wc-dash/v1' },           // 5. QS Legacy
        { auth: 'query_string', prefix: 'woodash/v1' }            // 6. QS Alternate
    ];

    let lastError = null;
    const triedKeys = new Set();

    for (const strat of strategies) {
        // Avoid duplicate attempts if user's setting is already query_string
        const key = `${strat.auth}|${strat.prefix}`;
        if (triedKeys.has(key)) continue;
        triedKeys.add(key);

        try {
            const client = makeClient(strat.auth);
            const path = `${strat.prefix}/${pathSuffix}`;
            const res = method === 'GET' ? await client.get(path) : await client.post(path, data);
            return res.data;
        } catch (e) {
            lastError = e;
            // Continue trying other strategies on error
            // console.warn(`Strategy ${key} failed:`, e.message);
        }
    }
    throw lastError;
};

export const fetchCarts = async (settings) => {
    return executeHelperRequest(settings, 'GET', 'carts');
};

export const sendEmail = async (settings, data) => {
    return executeHelperRequest(settings, 'POST', 'email/send', data);
};

export const fetchSMTP = async (settings) => {
    return executeHelperRequest(settings, 'GET', 'settings/smtp');
};

export const saveSMTP = async (settings, data) => {
    return executeHelperRequest(settings, 'POST', 'settings/smtp', data);
};

export const fetchVisitorCount = async (settings) => {
    return executeHelperRequest(settings, 'GET', 'visitors');
};

export const fetchVisitorLog = async (settings) => {
    return executeHelperRequest(settings, 'GET', 'visitor-log');
};

export const fetchSystemStatus = async (settings) => {
    try {
        return await executeHelperRequest(settings, 'GET', 'status');
    } catch (e) {
        return null;
    }
};

export const installDB = async (settings) => {
    return executeHelperRequest(settings, 'POST', 'install-db');
};

export const createTestVisit = async (settings) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(settings.storeUrl, settings.consumerKey, settings.consumerSecret, settings.authMethod);
    const response = await client.post('overseek/v1/test-visit');
    return response.data;
};

export const fetchWCSettings = async (settings, group, id) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    // Endpoint: /settings/{group}/{id}
    const response = await client.get(`/settings/${group}/${id}`);
    return response.data;
};

export const fetchTaxRates = async (settings, params = {}) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(
        settings.storeUrl,
        settings.consumerKey,
        settings.consumerSecret,
        settings.authMethod
    );
    const response = await client.get('/taxes', { params });
    return response.data;
};

export const fetchChatMessages = async (settings, params = {}) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(settings.storeUrl, settings.consumerKey, settings.consumerSecret, settings.authMethod);
    const response = await client.get('overseek/v1/chat/messages', { params });
    return response.data;
};

export const sendChatMessage = async (settings, data) => {
    if (!settings.storeUrl || !settings.consumerKey) throw new Error("API not configured");
    const client = createWCClient(settings.storeUrl, settings.consumerKey, settings.consumerSecret, settings.authMethod);
    const response = await client.post('overseek/v1/chat/send', data);
    return response.data;
};

// --- Geocoding (Nominatim) ---
const GEO_CACHE = {};
const LAST_GEO_CALL = { time: 0 };

export const geocodeAddress = async (address) => {
    if (!address) return null;

    // Check Cache first (simple memory cache, persistence layer handles DB)
    if (GEO_CACHE[address]) return GEO_CACHE[address];

    // Rate Limit: 1 request per second
    const now = Date.now();
    const timeSinceLast = now - LAST_GEO_CALL.time;
    if (timeSinceLast < 1000) {
        await new Promise(r => setTimeout(r, 1000 - timeSinceLast));
    }
    LAST_GEO_CALL.time = Date.now();

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
            headers: {
                'User-Agent': 'OverSeek-App/1.0'
            }
        });

        const data = await response.json();
        if (data && data.length > 0) {
            const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            GEO_CACHE[address] = result;
            return result;
        }
    } catch (e) {
        console.error("Geocoding failed for", address, e);
    }
    return null;
};
export const restartServer = async (settings) => {
    // This hits our local middleware backend via the Vite proxy
    const response = await axios.post('/admin/restart');
    return response.data;
};
