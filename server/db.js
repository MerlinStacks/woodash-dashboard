const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const initDB = async () => {
    try {
        let client;
        try {
            client = await pool.connect();
        } catch (err) {
            if (err.code === '3D000') { // Database 'overseek' does not exist
                console.warn("[initDB] Database 'overseek' missing. Attempting auto-creation...");

                let adminConnectionString;

                if (process.env.DATABASE_URL) {
                    try {
                        const dbUrl = new URL(process.env.DATABASE_URL);
                        const targetDb = dbUrl.pathname.replace('/', '');
                        dbUrl.pathname = '/postgres';
                        adminConnectionString = dbUrl.toString();
                        console.log(`[initDB] Detected target DB '${targetDb}'. Switching to 'postgres' for creation.`);
                    } catch (e) {
                        console.warn("[initDB] API URL parsing failed, using regex fallback.");
                        adminConnectionString = process.env.DATABASE_URL.replace(/\/overseek(\?|$)/, '/postgres$1');
                    }
                } else {
                    adminConfig = { database: 'postgres' };
                }

                const adminConfig = adminConnectionString ? { connectionString: adminConnectionString } : { database: 'postgres' };
                const adminPool = new Pool(adminConfig);

                try {
                    const adminClient = await adminPool.connect();
                    try {
                        await adminClient.query('CREATE DATABASE overseek');
                        console.log("[initDB] Database 'overseek' created successfully.");
                    } catch (qe) {
                        if (qe.code === '42P04') {
                            console.log("[initDB] Database 'overseek' already exists (race condition).");
                        } else {
                            throw qe;
                        }
                    } finally {
                        adminClient.release();
                    }
                } catch (ce) {
                    console.error("[initDB] CRITICAL: Auto-creation failed.", ce.message);
                    if (ce.code === '42501') {
                        console.error("[initDB] Permission Denied: The DB user does not have privilege to CREATE DATABASE.");
                    }
                } finally {
                    await adminPool.end();
                }

                await new Promise(r => setTimeout(r, 1000));
                client = await pool.connect();
            } else {
                throw err;
            }
        }

        await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        const tables = ['orders', 'products', 'reviews', 'customers', 'coupons'];
        for (const table of tables) {
            await client.query(`
                CREATE TABLE IF NOT EXISTS "${table}" (
                    id BIGINT PRIMARY KEY,
                    data JSONB,
                    synced_at TIMESTAMPTZ DEFAULT NOW()
                );
            `);
        }

        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN ((data->>'name') gin_trgm_ops);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_account ON products ((data->>'account_id'));`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_products_parent ON products ((data->>'parent_id'));`);

        console.log('PostgreSQL initialized: Tables, Extensions & Indexes ready.');
        client.release();
    } catch (err) {
        console.error('Failed to initialize PostgreSQL:', err.message);
    }
};

module.exports = { pool, initDB };
