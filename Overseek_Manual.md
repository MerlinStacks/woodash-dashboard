# Overseek: The Sovereign Commerce Operating System
## Comprehensive Manual & Feature Reference

**Last Updated:** January 2026
**Version:** 2.0 (Iron Core)

---

## 1. Introduction

**Overseek** is a sovereign, self-hosted commerce operating system designed to replace disjointed SaaS tools with a unified, high-performance "Iron Core." It empowers merchants with total data ownership, zero-latency intelligence, and a unified nervous system for their commerce operations.

It consolidates the functionality of platforms like Metorik (Analytics), FunnelKit (Marketing), Crisp (Chat), and Matomo (Tracking) into a single, cohesive interface.

### The Philosophy
- **Sovereignty**: You own your data. No third-party data silos.
- **Speed**: "Hot Tier" local databases (Dexie.js) for instant UI interactions.
- **Intelligence**: An "Intelligence Oracle" that doesn't just report data but suggests actions.
- **Unity**: A single mesh where customer support talks to inventory, and marketing listens to logistics.

---

## 2. System Architecture

Overseek is built as a modern full-stack monorepo designed for performance and scale.

### Core Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS (Glassmorphism), Shadcn/UI.
- **Backend API**: Fastify (Node.js), Redis 7 (AOF Persistence).
- **Workload Management**: BullMQ for robust background job processing (Orders, Products, Customers, Reviews, Reports).
- **Search Engine**: Elasticsearch 7.17 (Global Search & Indexing) co-existing with Postgres.
- **Database**: PostgreSQL 16 (with pgvector for AI & RLS for security).
- **Real-Time**: Socket.io for instant order updates and chat.
- **Storage**: MinIO (S3 Compatible) for assets and backups.
- **Infrastructure**: Docker Compose for easy deployment.

---

## 3. Integration Protocols

Overseek connects to your existing commerce platforms (primarily WooCommerce) using a dual-protocol strategy.

### A. Live Analytics (Zero-Config)
 *Designed for instant visibility without complex API permissions.*
*   **Method**: A "Paste JSON" configuration model.
*   **Setup**:
    1.  Go to `Settings > Analytics` in the Overseek Dashboard.
    2.  Copy the generated JSON Blob (contains `apiUrl` and `accountId`).
    3.  Paste it into the Overseek WordPress Plugin settings.
*   **Privacy**: Uses First/Last click attribution and UUID-based visitor tracking.
*   **Events Captured**: Pageviews, Add to Cart (with product metadata), Checkout Start, Heartbeat.

### B. Core Sync Engine (Deep Data)
 *Designed for operational control (Inventory, Orders, Customers).*
*   **Method**: Handshake-based API Sync.
*   **Requirements**: WooCommerce REST API Keys (Read/Write recommended for full automation).
*   **Features**:
    *   **Delta Pull**: Only fetches changed data since the last sync.
    *   **Webhooks**: Real-time updates pushed from WooCommerce to Overseek.

---

## 4. Feature Modules (A-Z)

### Analytics & Growth
*   **Attribution Modeling**: Tracks First Click vs. Last Click UTM sources to determine true marketing ROI.
*   **Live Vitals Monitor**: Real-time AreaCharts showing revenue velocity, active visitors, and conversion pulses.
*   **Sector Analysis**: Breakdown of sales by category, region, or customer type.
*   **Search Term Analysis**: Insight into what users are searching for on your storefront.
*   **Reporting Engine**: A dedicated Report Worker generates heavy reports via queue (Weekly/Monthly schedules supported).

### Commerce Engine
*   **Hyper-Grid**: A high-performance table view for managing thousands of Orders or Products instantly.
*   **Identity Matrix (CRM)**: Comprehensive customer profiles merging order history, chat logs, and sentiment analysis.
*   **Supplier Management**: Track product sources, manage "Shadow Inventory" at suppliers, and handle Purchase Orders with "Draft/Keyed/Received" statuses.
*   **Ad Account Integration**: Built-in modeling for Meta and Google Ads accounts (storing access tokens/refresh tokens).

### Communication Mesh (Unified Inbox)
*   **Channels**: Unifies Email (IMAP/SMTP), Live Chat.
*   **Collaborative Inbox**:
    *   **Presence**: See when other staff members are viewing a ticket.
    *   **Internal Notes**: Private team discussions within customer threads.
    *   **Product Injection**: Send "Buy Now" product cards directly in chat.
    *   **Canned Responses**: Quick-reply shortcuts managed via the dashboard.

### Intelligence Oracle
*   **Command Center (OmniSearch)**: A `⌘K` command palette backed by Elasticsearch for sub-second global search across Orders, Customers, and Settings.
*   **Flow Builder**: A visual, node-based automation editor (React Flow) for creating marketing workflows.
*   **Oracle Insights**: AI-powered suggestions (e.g., "Stock low on Item X").

### Marketing & Optimization
*   **SEO Scoring Engine**: Analyzing product titles, descriptions, and keywords against SEO best practices (`SeoScoringService`).
*   **Merchant Center Validator**: Validates products against Google Merchant Center requirements.
*   **Visual Invoice Designer**: Drag-and-drop editor (`InvoiceDesigner.tsx`) using `react-grid-layout` to create custom invoice templates stored as JSON.
*   **Segmentation**: Dynamic Customer Segments based on total spent, order count, or specific criteria.

### Operations & Fabrication
*   **Audit Mode**: Mobile-optimized interface for warehouse staff to perform stocktakes by Bin Location (`AuditService`), logging every action.
*   **Fabrication Nervous System**: Manage Bill of Materials (BOM) and track manufacturing stages.
*   **Gold Price Service**: Live tracking of gold prices (via GoldAPI.io) for jewelry merchants.
*   **Picklist Generation**: Integrated PDF picklist generation for warehouse efficiency (`PicklistService`).
*   **Inventory Settings**: Configurable "Low Stock" thresholds and email alerts.

### Onboarding & Support
*   **Setup Wizard**: A guided onboarding flow (`SetupWizard.tsx`) for initial store configuration.
*   **Help Center CMS**: A fully database-backed content management system for internal documentation (`HelpCollection`, `HelpArticle`).

### Security (Iron Core)
*   **Authorization**: Role-Based Access Control (RBAC) with Row Level Security (RLS).
*   **Session Security**: HTTP-only cookies, session rotation, and refresh token support.
*   **Sovereign Settings**: Tools for data pruning ("The Janitor") and system diagnostics.
*   **Audit Logging**: Comprehensive `AuditLog` table tracking 'CREATE', 'UPDATE', 'DELETE' actions on critical resources.

---

## 5. Future Roadmap & Upcoming Features

### 🔌 WooCommerce Plugin Enhancements
*   **Admin Menu Integration**: Dedicated settings page directly in WP Admin.
*   **Feature Toggles**: Granular control over tracking scripts and chat widgets.

### 💰 Financial Suite
*   **Visual Invoice Designer**: Drag-and-drop editor for custom invoice templates.
*   **Tax Automation**: Detailed tax breakdown and handling.

### 📣 Unified Marketing Expansion
*   **SMS & WhatsApp Nodes**: Add direct messaging nodes to the Automation Flow Builder.
*   **MMS Support**: Rich media messaging.

---

*This document serves as the master reference for the Overseek ecosystem.*
