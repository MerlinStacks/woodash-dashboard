# WooDash / OverSeek Architecture Documentation

## 1. Project Overview

**OverSeek (fka WooDash)** is a high-performance, local-first dashboard for WooCommerce. It provides store owners with instant access to their data by synchronizing it to a local browser database (IndexedDB) and offering a premium, glassmorphism-styled UI.

### Core Principles
- **Local-First:** Data is synchronized via a Web Worker to `Dexie.js` (IndexedDB). The UI renders from this local store, ensuring zero-latency navigation.
- **Proxy-Mediated:** A specialized Node.js Proxy (`server/index.js`) sits between the browser and WooCommerce. It handles CORS, Authentication Failover, and Request Caching.
- **Resilient Connectivity:** Implements a robust "6-Level Failover Strategy" to connect to WooCommerce under any server condition (WAFs, ModSecurity, Query String limitations).
- **Multi-Tenancy:** Supports managing multiple stores (Accounts) simultaneously, with strict data isolation via `account_id`.

### Technology Stack
- **Frontend:** React.js (Vite), Wouter (Routing).
- **Local DB:** Dexie.js (IndexedDB Wrapper).
- **Backend Proxy:** Node.js, Express, Redis (Caching), Socket.io (Real-time).
- **WordPress Plugin:** `overseek-helper.php` (Custom API Endpoints).

---

## 2. Core Architecture

### 2.1. Dual Database Strategy (Split Brain)
The application utilizes two distinct databases for different purposes:

1.  **Browser Database (IndexedDB / Dexie.js):**
    *   **Purpose:** Powers the **User Interface**, Search, Filters, and Automations.
    *   **Content:** Full synchronization of Products, Orders, Customers.
    *   **Optimization:** Uses lazy pagination and compound indexes to minimize RAM usage in the browser.
    *   **Why:** Enables "Instant" interactions and Offline support.

2.  **Server Database (PostgreSQL / Docker):**
    *   **Purpose:** Long-term **Archival** and Disaster Recovery.
    *   **Content:** **Orders Only** (Currently). The Proxy asynchronously inserts fetched orders here.
    *   **Why:** Provides a data backup that survives browser cache clearing.

### 2.2. The "Smart Proxy" (`server/index.js`)
The App does not connect directly to WC API V3. It connects to `http://localhost:3001/api/proxy`.
- **Role:** Bypass CORS, Cache repeated GET requests (Redis), and normalize Error responses.
- **Auth Handling:**
    - Supports `Authorization: Basic ...` headers.
    - Supports `?consumer_key=...&consumer_secret=...` query params (Critical for hosts that strip headers).
- **Routing:**
    - Standard WC requests -> `/wp-json/wc/v3/...`
    - Custom Plugin requests -> `/wp-json/overseek/v1/...` (with fallback to `wc-dash/v1` or `woodash/v1`).

### 2.3. The Sync Engine (`src/workers/sync.worker.js`)
Synchronization runs in a dedicated **Web Worker** to prevent UI freezing.
- **Mode:** Full Sync (Pages 1...N) or Delta Sync (Modified After X).
- **Weighted Progress:** Reports granular progress based on entity weight (Products 40% -> Orders 70% -> Customers 85% -> etc.).
- **V2 Features:**
    - **Safe Parsing:** Handles Proxy-wrapped responses (`{ data: [...], totalPages: N }`).
    - **Enrichment:** Adds `account_id` and ensures `parent_id` integrity (default 0) for all items.
    - **Automation:** Directly inspects Orders for status changes to trigger "Email Rules" defined in the UI.

### 2.4. The Helper Plugin (`overseek-helper.php v2.4`)
A lightweight, single-file plugin required on the WordPress site.
- **Safe Mode:** Does NOT use `register_activation_hook` (avoids critical errors). Uses `admin_init` transient checks to flush permalinks.
- **Universal Namespaces:** Registers routes under `overseek/v1`, `wc-dash/v1`, and `woodash/v1` simultaneously to ensure compatibility with any dashboard version.
- **Endpoints:**
    - `/carts`: Live abandoned cart data.
    - `/system-status`: Health check (PHP version, WC version).
    - `/email/send`: SMTP wrapper.

---

## 3. Directory Structure & Key Modules

### `src/db/`
- **`db.js`**: Dexie Schema Definition.
    - **Versioning**: Uses strict versioning (currently v22+).
    - **Schema**: e.g., `products_v2`, `orders`, `visits`. Keys are compound `[account_id+id]`.

### `src/services/`
- **`api.js`**: The central API client.
    - **Unwrapping**: Automatically extracts Arrays from Proxy `{ data: [...] }` wrappers.
    - **Failover**: `executeHelperRequest` tries all 3 namespaces combinations until one works.
- **`backupService.js`**: JSON Export/Import for App Settings & Automations.

### `src/components/settings/`
- **`SystemStatus.jsx`**: Diagnostic tool. Checks:
    1.  Local DB Health (Count of items).
    2.  Helper Plugin Connectivity.
    3.  Store API Connectivity.

### `src/pages/`
- **`Inventory.jsx`**: Advanced Product Manager.
    - **Recipe Logic**: Allows defining Bundles (Composition). Calculates "Potential Stock" based on child component stock.
    - **Variant Hiding**: Strict filtering to ensure specific Variants do not clutter the main list.
    - **Performance**: Uses DB-Level Pagination (v25) to avoid Memory Crashes.
- **`Carts.jsx`**: Live view of Abandoned Carts (via Helper Plugin).
- **`Orders.jsx`**: Order Management with segmenting and batch actions.

### `src/context/`
- **`SyncContext.jsx`**: Worker Manager. Spawns `sync.worker.js` and listens for messages.
- **`SettingsContext.jsx`**: Manages global preferences (Currency, Store URL).

---

## 4. Security & Isolation

- **API Keys**: Stored in `localStorage` (encrypted at rest by browser) or `IndexedDB`. Never sent to 3rd party.
- **Cross-Account Safety**: Every DB query includes `.where('account_id').equals(activeAccount.id)`.
- **Proxy Security**: The Node Proxy does not store keys. It forwards them.

## 5. Deployment

- **Docker**: `Dockerfile` + `docker-compose.prod.yml` available for containerized deployment.
- **Environment**: Requires `REDIS_URL` for caching.

---

## 6. Known Patterns & Gotchas
- **"Variants Showing":** If variants appear in Inventory, check `p.type` is 'variation' and `p.parent_id > 0`. The UI filters strictly on these.
- **"Sync Stuck":** Often due to Proxy returning wrapped JSON while Worker expects Array. (Fixed in v2 Worker).
- **"Helper 404":** Often due to Host stripping Authorization header. Use "Query Param" auth mode in Settings. 
