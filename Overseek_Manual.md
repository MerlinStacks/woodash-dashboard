# Overseek: The Sovereign Commerce Operating System
## Ultimate Reference Manual & Feature Guide

**Last Updated:** January 2026
**Version:** 2.0 (Iron Core)

---

## 1. Introduction & Philosophy

**Overseek** is a sovereign, self-hosted commerce operating system designed to replace disjointed SaaS tools with a unified, high-performance "Iron Core." It empowers merchants with total data ownership, zero-latency intelligence, and a unified nervous system for their commerce operations.

It consolidates the functionality of platforms like **Metorik** (Analytics), **FunnelKit** (Marketing), **Crisp** (Chat), and **Matomo** (Tracking) into a single, cohesive interface.

### The "Iron Core" Philosophy
1.  **Sovereignty First**: You own your database. There are no third-party data silos. You decide when to prune your data, not a SaaS billing cycle.
2.  **Instant Speed**: We use a **Tiered Storage** architecture.
    *   **Hot Tier (Dexie.js)**: Local browser storage (IndexedDB) mirrors your recent active data (up to 5,000 records). This allows for instant searching, filtering, and sorting without hitting the server.
    *   **Cold Tier (Postgres)**: The remote server holds the infinite historical record, accessed via efficient pagination when you scroll past the "Hot" limit.
3.  **Unified Intelligence**: A single mesh where customer support acts on inventory patterns, and marketing listens to logistics data.
    *   *Example*: If a user complains about a delay in Chat, the agent can instantly see the "Backordered" status from the Inventory module without switching tabs.

---

## 2. Infrastructure & Architecture

Overseek is built as a modern full-stack monorepo designed for performance, scale, and ease of deployment.

### 2.1 The Tech Stack
*   **Frontend (The Head)**: Built with **React 19**, **Vite**, and **TypeScript**.
    *   **Architecture**: "Thin Client" model (`AnalyticsService.ts`). The client handles UI state and visualization, but heavy number-crunching is offloaded to the API.
    *   **State Management**: **React Context** (`AuthContext`, `SocketContext`) manages global user sessions and real-time streams.
*   **Backend (The Spine)**: **Fastify** (Node.js) provides a high-throughput API layer, chosen for its low overhead compared to Express.
*   **Database (The Memory)**: **PostgreSQL 16**.
    *   **pgvector**: Enabled for future AI/Vector search capabilities.
    *   **Schema**: managed via Prisma ORM (`schema.prisma`), serving as the single source of truth for all data models.
*   **Search Engine (The Eyes)**: **Elasticsearch 7.17**.
    *   **OmniSearch**: Powers the global command palette (`Cmd+K`). It indexes Orders, Customers, and Products for sub-second text search, distinct from the transactional SQL database.
*   **Real-Time Mesh**: **Redis 7** (AOF Persistence) and **Socket.io**.
    *   **Live Updates**: Pushes "Order Created" or "Message Received" events to connected clients instantly.
    *   **Presence**: Tracks which users are currently viewing specific documents (e.g., "User A is viewing Order #123") via Redis Hashes in `CollaborationService.ts`.

### 2.2 Background Workers
Heavy lifting is offloaded to **BullMQ** workers to keep the API responsive (verified in `server/src/workers/index.ts`).
*   `ORDERS_QUEUE`: Syncs new orders from WooCommerce.
*   `PRODUCTS_QUEUE`: Updates inventory levels and catalog data.
*   `CUSTOMERS_QUEUE`: Syncs customer profiles and lifetime value data.
*   `REVIEWS_QUEUE`: Imports product reviews.
*   `REPORTS_QUEUE`: Generates heavy PDF/CSV reports on a schedule.

### 2.3 Middleware & Security
*   **Rate Limiting**: Configured in `app.ts`.
    *   **Limit**: 2000 requests per 15 minutes per IP. This high limit accommodates the aggressive polling nature of the dashboard's "Live View".
*   **Security Headers**: `Helmet` is configured with a strict Content Security Policy (CSP).
    *   **Note**: CSP is dynamically adjusted to allow the injection of the Chat Widget script.
*   **Encryption**: Sensitive credentials (e.g., SMTP passwords, Meta Ads tokens) are encrypted at rest using **AES-256** (`encryption.ts`).
*   **Cache Control**: All API responses enforce `no-store` headers to ensure data viewed in the dashboard is always real-time.

---

## 3. Integration Protocols

Overseek connects to your existing commerce platforms (primarily WooCommerce) using a dual-protocol strategy designed for both speed and depth.

### Protocol A: Live Analytics (Zero-Config)
*Designed for instant visibility without complex API permissions.*

*   **Concept**: This protocol allows you to start tracking visitors immediately, even if you don't have full API keys for the store yet.
*   **Mechanism**: A "Paste JSON" configuration model.
*   **The Config Blob**:
    ```json
    {
      "apiUrl": "https://your-overseek-instance.com",
      "accountId": "acc_123456789"
    }
    ```
*   **Steps to Enable**:
    1.  Navigate to `Settings > Analytics` in the Overseek Dashboard.
    2.  Copy the generated JSON blob.
    3.  In WordPress, go to `WooCommerce > Overseek`.
    4.  Paste the blob into the "Connection Config" field and click Save.
*   **Events Captured**:
    *   `pageview`: Tracks every page load.
    *   `add_to_cart`: Captures `product_id` and `quantity` (vital for Abandoned Cart recovery).
    *   `checkout_start`: The moment a user focuses the billing email field.
    *   `heartbeat`: Pings every 30 seconds to track "Time on Site".

### Protocol B: Core Sync Engine (Deep Data)
*Designed for operational control (Inventory, Orders, Customers).*

*   **Concept**: A deep, bi-directional sync that mirrors your WooCommerce database into Overseek.
*   **Handshake**: Uses the standard WooCommerce REST API (`wc/v3`).
    *   **Permissions**: We recommend **Read/Write** keys. "Read" allows for analytics, but "Write" is required to update inventory, manage orders, or push tracking numbers back to the store.
*   **Synchronization Strategy**:
    *   **Delta Pull**: To save bandwidth, Overseek only requests records modified *after* the `last_synced_at` timestamp of the previous successful sync.
    *   **Webhooks**: Overseek automatically registers webhooks (if Write access is available) to receive real-time push events (`order.created`, `product.updated`) immediately without waiting for the next poll.

---

## 4. Feature Modules (The A-Z Guide)

### 📊 Analytics & Growth
*   **Live Vitals Monitor**: A real-time dashboard showing revenue velocity, active visitor count, and "pulses" for carts and conversions.
*   **Attribution Modeling**: Distinguishes between sources to show true marketing ROI.
    *   **First Click**: How did they *find* you? (Brand Awareness)
    *   **Last Click**: What made them *buy*? (Conversion Driver)
*   **Reporting Engine**: An automated system (`ReportWorker`) that generates comprehensive PDFs (Weekly/Monthly execution summaries) and emails them to stakeholders.

### 🤖 Automation & Marketing
*   **Visual Flow Builder**: A powerful, drag-and-drop node editor built on **React Flow**.
    *   **Nodes**: Trigger (start), Action (Email/SMS), Delay (Wait X hours), Condition (If/Else).
    *   **Interface**: `FlowBuilder.tsx` provides the canvas.
*   **Automation Engine (The Brain)**: The server-side logic (`AutomationEngine.ts`) that executes these flows.
    *   **Trigger Filters**: Can pre-filter users involved in an automation (e.g. "Only run if Order Value > $50").
    *   **Cycle Guard**: A safety mechanism that imposes a hard limit of **20 steps** to prevent infinite loops in faulty user-created flows.
    *   **Context Injection**: Dynamic variables like `{{customer.firstName}}` are replaced with real data at runtime.
    *   **Dynamic Attachments**: Can generate documents (like Invoices) mid-flow and attach them to subsequent emails.

### 🛍️ Commerce Engine
*   **Hyper-Grid**: A high-performance table interface for managing Orders, Products, and Customers.
    *   **Features**: Bulk tagging, status changing, and "Excel-like" editing.
*   **Supplier Management**: Track product sources and manage **Shadow Inventory** (stock held at the supplier, not in your warehouse).
*   **Identity Matrix (CRM)**: A unified customer profile that merges:
    *   **Order History**: LTV (Lifetime Value), AOV (Average Order Value).
    *   **Communication**: Merges chat logs and email threads into a single timeline.
    *   **Engagement**: Tracks marketing email opens and clicks.

### 💬 Communication Mesh (Unified Inbox)
*   **Dynamic Chat Widget (The "Trojan Horse")**:
    *   **Smart Loading**: The widget script (`widget.js`) is dynamically generated by the server. It checks "Business Hours" and IP Blocks *before* sending code to the client. If the store is closed, the widget code is effectively empty, saving the client from loading heavy UI libraries.
    *   **Features**: Live Chat, Product Cards ("Buy Now"), and File Sharing.
*   **Collaborative Inbox**:
    *   **Presence**: See who else is viewing a ticket to prevent collisions.
    *   **Internal Notes**: Yellow-highlighted messages visible only to staff.
    *   **Canned Responses**: Quick template monitoring.

### 🧠 Intelligence Oracle (Heuristics)
*   **OmniSearch**: A "Spotlight" for your commerce data. Press `Cmd+K` to search anything—Customer Name, Order ID, SKU, or Setting. Backed by **Elasticsearch** for typo-tolerance.
*   **Inventory Intelligence**: `InventoryTools.ts` analyzes stock velocity to surface:
    *   **Low Stock**: Items approaching reorder points.
    *   **Dead Stock**: Items that haven't moved in X days.
*   **Sales Intelligence**: `SalesTools.ts` performs on-the-fly aggregation for "Today vs. Yesterday" performance comparisons.

### 📢 Marketing & Optimization
*   **SEO Scoring Engine**: Analyzing product titles, descriptions, and URL handles against 20+ SEO best practices (`SeoScoringService`).
*   **Merchant Center Validator**: Checks products for Google Shopping compliance (checking for GTIN, Image, Price, and Availability).
*   **Visual Invoice Designer**: A drag-and-drop editor (`InvoiceDesigner.tsx`) that allows you to build custom PDF layouts for your invoices, saved as JSON templates.

### 🏭 Operations & Fabrication
*   **Audit Mode**: A mobile-first interface designed for barcode scanners. Warehouse staff can scan a Bin Location and verify the counts.
*   **Fabrication Nervous System**: Manages **Bills of Materials (BOM)**. Critical for merchants who manufacture their own goods (e.g., jewelry, furniture). Tracks raw material usage against finished goods.
*   **Gold Price Service**: Connects to `GoldAPI.io` to update product prices in real-time based on market spot prices (for jewelry merchants).
*   **Picklist Generation**: Generates optimized PDF picklists that sort items by Bin Location to minimize walking distance in the warehouse.

### 🛠️ Administration & Maintenance
*   **System Health UI**: A dedicated dashboard (`SystemHealth.tsx`) for system admin.
    *   **Capabilities**: Monitor Server Uptime, View/Download System Logs, Clear Logs manually.
*   **Maintenance Scripts**: A suite of CLI tools in `server/src/scripts` for power users:
    *   `reindex-orders.ts`: Forces a complete rebuild of the Elasticsearch index.
    *   `deep-diagnostic.ts`: Runs integrity checks on database relationships.

---

## 5. Roadmap vs. Reality

To ensure complete transparency, this section distinguishes between what is currently shipped and what is planned.

### ✅ Implemented (Reality)
*   **Core**: Full "Iron Core" stack (Node, React, Postgres, Redis, Elastic).
*   **Chat**: Dynamic server-side widget generation.
*   **Automation**: Server-side execution engine with cycle guards.
*   **Integration**: Full WooCommerce sync + Live Analytics.

### 🚧 Roadmap (Vision)
*   **The Janitor**: *Planned*. An automated background service to prune old logs and analytics data based on retention policies.
*   **Stack Purge**: *Planned*. A "Factory Reset" button to wipe all data and start fresh without command-line intervention.
*   **Neural AI**: *Planned*. Replacing the current heuristic logic (`SalesTools.ts`) with actual LLM-based predictive modeling for inventory forecasting.

---

*This document serves as the master source of truth for the Overseek ecosystem.*

---

## 6. Additional Technical Reference (Micro-Features)

### 6.1 Hybrid Logic Engines
To ensure both **instant UI feedback** and **reliable background processing**, Overseek implements a "Hybrid" logic strategy for key features:

*   **SEO Scoring**:
    *   **Client (`seoScoring.ts`)**:Runs in real-time within the `ProductEditor`. As you type, the score updates instantly without hitting the API.
    *   **Server (`SeoScoringService.ts`)**: Runs systematically during bulk imports or nightly audits to catch regressions.
*   **Invoice Generation**:
    *   **Client (`InvoiceGenerator.ts`)**: Uses `jspdf` to render PDF previews in the browser using a **12-Column Grid System**. It performs `{{handlebars}}` variable replacement locally.
    *   **Server**: Uses a matching logic to generate attachments for automated emails.

### 6.2 Administrative Access Points
*   **Bull Board UI**: The background worker dashboard is securely proxied via `vite.config.ts`.
    *   **URL**: `/admin/queues`
### 6.3 Advanced Developer Tools
*   **Debug Endpoints**: Located in `server/src/routes/debug.ts`, these allow for raw Elasticsearch queries (e.g., `GET /api/debug/count`) to verify index integrity without using the UI.
*   **Ad Token Masking**: The `AdsService` middleware (`ads.ts`) automatically masks access tokens (returning only the first 10 chars) before sending data to the frontend, preventing credential leakage in browser network logs.
### 6.4 Infrastructure Tuning & Data Safety
*   **Worker Concurrency**: The `QueueFactory` is hardcoded to a **concurrency limit of 5**. This means a single specific queue (e.g., `sync-orders`) can process maximum 5 jobs in parallel per container. This prevents the API from being overwhelmed during massive initial syncs.
*   **Elasticsearch Integrity**: The `IndexingService` includes a `deleteAccountData` protocol with a **Failsafe Verification Loop**. After issuing a delete-by-query command, it re-queries the index to ensure the document count is exactly 0. If any "Ghost Documents" remain (common in distributed systems), it logs a warning for manual intervention, ensuring strict data sovereignty compliance.
