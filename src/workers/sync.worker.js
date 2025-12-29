/* eslint-disable no-restricted-globals */
import { db } from '../db/db';

// Helper for Basic Auth encoding
const getAuthHeader = (key, secret) => {
    return `Basic ${btoa(`${key}:${secret}`)}`;
};

const fetchPage = async (url, params, headers) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${url}?${query}`, { headers });
    if (!res.ok) {
        throw new Error(`API Error ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();

    // Proxy returns { data: [...], totalPages: N }
    // We check the body first because our Proxy wraps it.
    const data = json.data || json;
    const bodyTotal = json.totalPages ? parseInt(json.totalPages, 10) : 0;
    const headerTotal = parseInt(res.headers.get('x-wp-totalpages') || '0', 10);

    // Use whichever is available, default to 1 if neither (but usually Proxy gives totalPages)
    const totalPages = bodyTotal || headerTotal || 1;

    return { data, totalPages };
};

self.onmessage = async (e) => {
    const msg = e.data;

    if (msg.type === 'START') {
        try {
            await startSync(msg);
        } catch (err) {
            self.postMessage({ type: 'ERROR', error: err.message });
        }
    }
};

const log = (message, level = 'info') => {
    self.postMessage({ type: 'LOG', message, level });
};

const reportProgress = (task, percentage) => {
    self.postMessage({ type: 'PROGRESS', task, percentage });
};

const startSync = async ({ config, accountId, options, lastSyncTimes, forceFull }) => {
    const { storeUrl, consumerKey, consumerSecret } = config;
    const authHeader = getAuthHeader(consumerKey, consumerSecret);
    const headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'x-store-url': storeUrl.replace(/\/$/, '') // Inject for Proxy
    };

    // Use Local Proxy
    const apiBase = `/api/proxy`;

    const newSyncTimes = { ...lastSyncTimes };
    const startTimeIso = new Date().toISOString();

    // Helper: Enrich with account_id
    const enrich = (items) => items.map(i => ({ ...i, account_id: accountId }));

    // Helper: Fetch Loop
    const syncEntity = async (endpoint, entityName, table, lastSyncKey, transformFn = null, basePct = 0, weight = 10) => {
        let page = 1;
        let totalPages = 1;
        let completedSuccess = true;

        // Prepare params
        const params = { per_page: 50, page: 1 };
        if (!forceFull && lastSyncTimes[lastSyncKey]) {
            params.after = lastSyncTimes[lastSyncKey];
        }

        reportProgress(`Syncing ${entityName}...`, basePct);

        do {
            try {
                // Fetch
                params.page = page;
                const { data, totalPages: total } = await fetchPage(`${apiBase}/${endpoint}`, params, headers);
                totalPages = total || 1; // Prevent divide by zero

                if (data.length > 0) {
                    let itemsToSave = enrich(data);
                    if (transformFn) {
                        itemsToSave = await transformFn(itemsToSave);
                    }
                    await table.bulkPut(itemsToSave);

                    // Calculate detailed progress
                    const progress = Math.min(basePct + Math.round((page / totalPages) * weight), basePct + weight);
                    log(`Synced ${entityName} page ${page}/${totalPages} (${data.length} items)`);
                    reportProgress(`Syncing ${entityName} (${Math.round((page / totalPages) * 100)}%)`, progress);
                }

                page++;
            } catch (err) {
                log(`Error syncing ${entityName} page ${page}: ${err.message}`, 'error');
                completedSuccess = false;
                break;
            }
        } while (page <= totalPages);

        if (completedSuccess) {
            newSyncTimes[lastSyncKey] = startTimeIso;
        } else {
            log(`Sync for ${entityName} incomplete. Will retry from previous timestamp next time.`, 'warning');
        }

        // Ensure we hit the top of the weight bracket when done
        reportProgress(`${entityName} Complete`, basePct + weight);
    };

    // 1. PRODUCTS (0-40%)
    if (options.products) {
        await syncEntity('products', 'Products', db.products, 'products', async (items) => {
            // Fetch Variations Logic
            const fetchPromises = items.map(async (item) => {
                const results = [item];

                if (item.type === 'variable') {
                    try {
                        const { data: vars } = await fetchPage(`${apiBase}/products/${item.id}/variations`, { per_page: 50 }, headers);
                        const enrichedVars = vars.map(v => ({
                            ...v,
                            name: `${item.name} - ${v.attributes.map(a => a.option).join(', ')}`,
                            type: 'variation',
                            parent_id: item.id,
                            account_id: accountId,
                            status: v.status || 'publish',
                            local_tags: item.local_tags || [],
                            description: v.description || item.description,
                            short_description: item.short_description,
                            images: (v.image && v.image.src) ? [v.image] : item.images
                        }));
                        results.push(...enrichedVars);
                    } catch (e) {
                        log(`Failed to fetch vars for product ${item.id}: ${e.message}`, 'warning');
                    }
                }
                return results;
            });

            const results = await Promise.all(fetchPromises);
            return results.flat();
        }, 0, 40);
    }

    // 2. ORDERS (40-70%)
    if (options.orders) {
        // Load active automations once
        const automations = await db.automations.toArray();
        const activeStatusRules = automations.filter(a => a.active && a.trigger_type === 'order_status_change');

        await syncEntity('orders', 'Orders', db.orders, 'orders', async (items) => {
            // 1. Transform
            const transformed = items.map(order => ({
                ...order,
                total_tax: order.total_tax || 0,
                account_id: accountId
            }));

            // 2. Automation Check (only if rules exist)
            if (activeStatusRules.length > 0) {
                const ids = transformed.map(o => o.id);
                const existingOrders = await db.orders.where('id').anyOf(ids).toArray();
                const existingMap = new Map(existingOrders.map(o => [o.id, o]));

                for (const newOrder of transformed) {
                    const oldOrder = existingMap.get(newOrder.id);
                    if (oldOrder && oldOrder.status !== newOrder.status) {
                        const rules = activeStatusRules.filter(r => r.conditions.status === newOrder.status);

                        for (const rule of rules) {
                            if (rule.action.type === 'send_email') {
                                try {
                                    const customerName = (newOrder.billing?.first_name || 'Customer');
                                    const subject = rule.action.subject
                                        .replace('{order_id}', newOrder.id)
                                        .replace('{customer_name}', customerName);
                                    const message = rule.action.message
                                        .replace('{order_id}', newOrder.id)
                                        .replace('{customer_name}', customerName);

                                    const emailEndpoint = `/api/proxy/overseek/v1/email/send`;

                                    await fetch(emailEndpoint, {
                                        method: 'POST',
                                        headers: headers,
                                        body: JSON.stringify({
                                            to: newOrder.billing.email,
                                            subject,
                                            message
                                        })
                                    });
                                    log(`Triggered '${rule.name}': Sent email to ${newOrder.billing.email}`);
                                } catch (e) {
                                    log(`Automation Error: ${e.message}`, 'error');
                                }
                            }
                        }
                    }
                }
            }

            return transformed;
        }, 40, 30);
    }

    // 3. CUSTOMERS (70-85%)
    if (options.customers) {
        await syncEntity('customers', 'Customers', db.customers, 'customers', null, 70, 15);
    }

    // 4. TAXES (85-90%)
    if (options.taxes) {
        reportProgress('Syncing Taxes', 85);
        try {
            const { data } = await fetchPage(`${apiBase}/taxes`, {}, headers);
            // Check for wrapped data if Proxy logic applies unexpectedly (though custom endpoints usually consistent)
            // But taxes is standard WP.
            // fetchPage unwraps json.data || json now.
            await db.tax_rates.where('account_id').equals(accountId).delete();
            await db.tax_rates.bulkAdd(enrich(data));
        } catch (e) {
            log(`Error syncing taxes: ${e.message}`, 'warning');
        }
        reportProgress('Taxes Sync Complete', 90);
    }

    // 5. REVIEWS (90-100%)
    if (options.reviews) {
        await syncEntity('products/reviews', 'Reviews', db.reviews, 'reviews', async (items) => {
            return items.map(r => ({
                id: r.id,
                product_id: r.product_id,
                status: r.status,
                rating: r.rating,
                date_created: r.date_created,
                content: r.review.replace(/<[^>]*>?/gm, ''),
                order_id: null,
                customer_id: r.reviewer_id || 0,
                reviewer_name: r.reviewer,
                reviewer_email: r.reviewer_email,
                photos: r.images || [],
                account_id: accountId
            }));
        }, 90, 10);
    }

    reportProgress('Sync Complete', 100);
    self.postMessage({ type: 'COMPLETE', newSyncTimes });
};
