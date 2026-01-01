# Database Schema Documentation

The application uses **PostgreSQL 16** managed by **Drizzle ORM**.

## Core Concepts
- **Multi-Tenancy:** All major entities (`orders`, `products`, `customers`) are scoped by `account_id` (Integer).
- **JSONB Data:** The schema uses a "Hybrid" approach where core IDs and foreign keys are columns, but the bulk of the object data (metadata, variation details) is stored in a `data` JSONB column.

## Tables

### Identity & Access
| Table | Description | Key Columns |
| :--- | :--- | :--- |
| **`users`** | Dashboard operators. | `id` (PK), `email`, `password_hash`, `default_store_id` |
| **`stores`** | Physical WooCommerce instances. | `id` (PK), `url`, `settings` (JSONB) |
| **`store_credentials`** | API Keys for stores. | `store_id` (FK), `consumer_key`, `consumer_secret` |
| **`roles`** | RBAC Definitions. | `id`, `name`, `store_id` |
| **`user_roles`** | User <-> Role mapping. | `user_id`, `role_id`, `store_id` |
| **`sessions`** | Fastify Session Store. | `id` (String PK), `user_id`, `expires_at` |

### Commerce Entities
All these tables follow the `StandardEntityColumns` pattern:
- `account_id` (Int): Tenant ID
- `id` (BigInt): WooCommerce ID
- `data` (JSONB): Full object payload from WP API
- `synced_at` (Timestamp)

| Table | Content |
| :--- | :--- |
| **`products`** | Simple and Variable products. |
| **`orders`** | Sales orders. |
| **`customers`** | User profiles from WP. |
| **`reviews`** | Product reviews. |
| **`coupons`** | Discount codes. |

### Sync State
| Table | Description |
| :--- | :--- |
| **`sync_state`** | Tracks the last sync timestamp per entity per account. used for "Delta Sync". |
| Columns | `account_id`, `entity` (e.g. 'products'), `last_synced_at` |

### Analytics & Marketing
| Table | Description |
| :--- | :--- |
| **`analytics_events`** | Internal tracking events. |
| **`ad_integrations`** | OAuth tokens for Meta/Google Ads. |
| **`ad_campaigns`** | Cached campaign performance metrics. |
