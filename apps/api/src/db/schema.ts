import { pgTable, text, timestamp, integer, uniqueIndex, jsonb, bigint } from 'drizzle-orm/pg-core';

export const syncState = pgTable('sync_state', {
    accountId: integer('account_id').notNull(),
    entity: text('entity').notNull(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastIdScan: timestamp('last_id_scan', { withTimezone: true }),
}, (table) => {
    return {
        pk: uniqueIndex('sync_state_pkey').on(table.accountId, table.entity)
    }
});

// Generic Columns Helper
const standardEntityColumns = {
    accountId: integer('account_id').notNull(),
    id: bigint('id', { mode: 'number' }).notNull(), // or custom bigint mode if needed
    data: jsonb('data').notNull(),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
};

// Tables
export const products = pgTable('products', standardEntityColumns, (t) => ({ pk: uniqueIndex('products_pkey').on(t.accountId, t.id) }));
export const orders = pgTable('orders', standardEntityColumns, (t) => ({ pk: uniqueIndex('orders_pkey').on(t.accountId, t.id) }));
export const reviews = pgTable('reviews', standardEntityColumns, (t) => ({ pk: uniqueIndex('reviews_pkey').on(t.accountId, t.id) }));
export const customers = pgTable('customers', standardEntityColumns, (t) => ({ pk: uniqueIndex('customers_pkey').on(t.accountId, t.id) }));
export const coupons = pgTable('coupons', standardEntityColumns, (t) => ({ pk: uniqueIndex('coupons_pkey').on(t.accountId, t.id) }));

// --- Identity & Access ---

export const stores = pgTable('stores', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(), // Rework says UUID, but sticking to int for ease unless specified? Rework says UUID. Let's use serial or UUID? Rework says UUID. Okay, need to import uuid. Or just separate migration. Let's stick to integer for internal references if possible, or string. Rework says "id (UUID)".
    // Wait, existing sync uses `accountId` as integer?
    // In `sync.js`: `accountId` is integer.
    // In `engine.ts`: `accountId: number`.
    // So sticking to integer for `stores.id` is safer for now to match `accountId`.
    url: text('url').notNull(),
    settings: jsonb('settings').default({}),
    createdAt: timestamp('created_at').defaultNow()
});

export const storeCredentials = pgTable('store_credentials', {
    storeId: integer('store_id').references(() => stores.id).notNull(),
    consumerKey: text('consumer_key').notNull(),
    consumerSecret: text('consumer_secret').notNull(), // Encrypted ideally
}, (t) => ({
    pk: uniqueIndex('store_creds_pkey').on(t.storeId)
}));

export const users = pgTable('users', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name'),
    defaultStoreId: integer('default_store_id').references(() => stores.id),
    createdAt: timestamp('created_at').defaultNow()
});

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(), // Session ID (random string)
    userId: integer('user_id').references(() => users.id).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow()
});

export const roles = pgTable('roles', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull(),
    storeId: integer('store_id').references(() => stores.id) // Null for global roles?
});

export const userRoles = pgTable('user_roles', {
    userId: integer('user_id').references(() => users.id).notNull(),
    roleId: integer('role_id').references(() => roles.id).notNull(),
    storeId: integer('store_id').references(() => stores.id)
}, (t) => ({
    pk: uniqueIndex('user_roles_pkey').on(t.userId, t.roleId, t.storeId)
}));

export const analytics_events = pgTable('analytics_events', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    event: text('event').notNull(),
    properties: jsonb('properties').notNull(),
    userId: integer('user_id').references(() => users.id),
    sessionId: text('session_id'),
    url: text('url'),
    timestamp: timestamp('timestamp').defaultNow()
});

export const ad_integrations = pgTable('ad_integrations', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    storeId: integer('store_id').references(() => stores.id).notNull(),
    platform: text('platform').notNull(),
    status: text('status').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    pixelId: text('pixel_id'),
    updatedAt: timestamp('updated_at').defaultNow()
}, (t) => ({
    pk: uniqueIndex('ad_integrations_pkey').on(t.storeId, t.platform)
}));

export const ad_campaigns = pgTable('ad_campaigns', {
    id: text('id').primaryKey(),
    storeId: integer('store_id').references(() => stores.id).notNull(),
    platform: text('platform').notNull(),
    name: text('name').notNull(),
    status: text('status').notNull(),
    spend: integer('spend').default(0),
    roas: integer('roas').default(0),
    impressions: integer('impressions').default(0),
    clicks: integer('clicks').default(0),
    syncedAt: timestamp('synced_at').defaultNow()
});

export const ad_suggestions = pgTable('ad_suggestions', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    storeId: integer('store_id').references(() => stores.id).notNull(),
    campaignId: text('campaign_id').references(() => ad_campaigns.id),
    type: text('type').notNull(),
    status: text('status').default('new'),
    data: jsonb('data'),
    createdAt: timestamp('created_at').defaultNow()
});


