const axios = require('axios');

// Global Status (In-Memory for MVP)
let currentStatus = {
    running: false,
    progress: 0,
    entity: '',
    error: null,
    details: ''
};

const getStatus = () => currentStatus;

const startSync = ({ storeUrl, consumerKey, consumerSecret, accountId, options }, dependencies) => {
    if (currentStatus.running) {
        return; // Already running
    }

    const { pool, redisClient } = dependencies;

    // Reset Status
    currentStatus = {
        running: true,
        progress: 0,
        entity: 'Initializing',
        error: null,
        details: 'Connecting to store...'
    };

    // Run in Background (Fire and Forget)
    (async () => {
        try {
            const authPrefix = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
            const api = axios.create({
                baseURL: `${storeUrl.replace(/\/$/, '')}/wp-json/wc/v3`,
                headers: {
                    'Authorization': authPrefix
                },
                timeout: 60000 // 60s timeout per req
            });

            const saveBatch = async (table, items) => {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    const query = `
                        INSERT INTO ${table} (id, data, synced_at)
                        VALUES ($1, $2, NOW())
                        ON CONFLICT (id) DO UPDATE SET data = $2, synced_at = NOW();
                    `;
                    for (const item of items) {
                        // Enrich with account_id for isolation
                        item.account_id = accountId;
                        await client.query(query, [item.id, JSON.stringify(item)]);
                    }
                    await client.query('COMMIT');
                } catch (e) {
                    await client.query('ROLLBACK');
                    throw e;
                } finally {
                    client.release();
                }
            };

            // 1. PRODUCTS
            if (options.products) {
                currentStatus.entity = 'Products';
                let page = 1;
                let totalPages = 1;

                do {
                    currentStatus.details = `Fetching page ${page}...`;
                    // Fetch
                    const res = await api.get('/products', { params: { page, per_page: 50 } });
                    totalPages = parseInt(res.headers['x-wp-totalpages'] || 1, 10);
                    const items = res.data;

                    // Process Variations
                    const processedItems = [...items];
                    for (const p of items) {
                        if (p.type === 'variable') {
                            try {
                                const vRes = await api.get(`/products/${p.id}/variations`, { params: { per_page: 100 } });
                                const variations = vRes.data.map(v => ({ ...v, type: 'variation', parent_id: p.id }));
                                processedItems.push(...variations);
                            } catch (ve) {
                                console.warn(`Failed to fetch variations for ${p.id}: ${ve.message}`);
                            }
                        }
                    }

                    // Save
                    if (processedItems.length > 0) {
                        await saveBatch('products', processedItems);
                    }

                    // Progress
                    currentStatus.progress = Math.round((page / totalPages) * 100);
                    page++;

                } while (page <= totalPages);
            }

            // 2. ORDERS
            if (options.orders) {
                currentStatus.entity = 'Orders';
                currentStatus.progress = 0;
                let page = 1;
                let totalPages = 1;

                do {
                    currentStatus.details = `Fetching page ${page}...`;
                    const res = await api.get('/orders', { params: { page, per_page: 50 } });
                    totalPages = parseInt(res.headers['x-wp-totalpages'] || 1, 10);

                    if (res.data.length > 0) {
                        await saveBatch('orders', res.data);
                    }

                    currentStatus.progress = Math.round((page / totalPages) * 100);
                    page++;

                } while (page <= totalPages);
            }

            // 3. REVIEWS
            if (options.reviews) {
                currentStatus.entity = 'Reviews';
                currentStatus.progress = 0;
                let page = 1;
                let totalPages = 1;

                do {
                    currentStatus.details = `Fetching page ${page}...`;
                    const res = await api.get('/products/reviews', { params: { page, per_page: 50 } });
                    totalPages = parseInt(res.headers['x-wp-totalpages'] || 1, 10);

                    if (res.data.length > 0) {
                        await saveBatch('reviews', res.data);
                    }

                    currentStatus.progress = Math.round((page / totalPages) * 100);
                    page++;

                } while (page <= totalPages);
            }

            // Complete
            currentStatus.running = false;
            currentStatus.entity = 'Complete';
            currentStatus.progress = 100;
            currentStatus.details = 'Sync Finished Successfully';

        } catch (err) {
            console.error("Server Sync Error:", err);
            currentStatus.running = false;
            currentStatus.error = err.message;
            currentStatus.details = 'Failed';
        }
    })();
};

module.exports = { startSync, getStatus };
