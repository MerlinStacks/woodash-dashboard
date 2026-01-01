OverSeek Development Plan: The Iron Core Protocol

Version: 27.0 (The Code Quality Edition)
Target Architecture: Dockerized Monorepo (Turbo), Node.js 22, PostgreSQL 16, Redis 7
Core Philosophy: Data Integrity, High Velocity, Strict Sovereignty
Strategic Goal: Consolidate FunnelKit, Metorik, Crisp, Matomo, Ad Managers, Affiliate Tools, and Manufacturing into a single sovereign stack.

PART 1: SYSTEM ARCHITECTURE & DATA

1. Technical Standards (The Foundation)

1.1 The Stack (Strict Selection)

Runtime: Node.js 22 (LTS) (Alpine Linux based containers).

Monorepo Tool: TurboRepo.

Package Manager: pnpm.

Frontend: React 19 + Vite + TypeScript 5.x.

UI Framework: Shadcn/UI + Tailwind CSS (Glassmorphism Config).

Component Docs: Storybook (For isolating and testing UI components).

State Management: Zustand (Client), TanStack Query v5 (Server).

Local DB: Dexie.js (IndexedDB Wrapper).

Backend: Fastify (High-performance API).

API Contract: REST + OpenAPI (Generated via Zod).

Database: PostgreSQL 16 (pgvector, pg_trgm).

Driver: postgres.js or pg (Configured to return BigInt as String).

ORM: Drizzle ORM (Type-safe SQL).

Queue: BullMQ on Redis 7.

Storage: MinIO (S3 Compatible).

1.2 The Infrastructure (Docker Compose)

Pin all images to specific SHAs/Versions. Do not use :latest.

services:
  app-api:        # Fastify REST API
  app-worker:     # Node.js Background Worker
  migrator:       # Ephemeral container for DB Schema Migrations (Runs as Bypass Role)
  db:             # PostgreSQL 16
  redis:          # Redis 7 (AOF Persistence Enabled)
  minio:          # Object Storage
  proxy:          # Traefik
  # Observability
  prometheus:     # Metrics
  grafana:        # Dashboards
  alertmanager:   # Critical Alerts (Queue Backlog, Sync Lag)


1.3 Security Hardening (Middleware & Auth)

CSRF Protection: Double-submit cookie or Fastify CSRF token.

Session Security:

httpOnly, Secure, SameSite=Strict.

Rotation: Rotate Session ID on login and privilege escalation.

Headers: helmet (HSTS, CSP).

Rate Limiting: Distinct limits for API vs Webhooks.

1.4 Multi-Tenancy Implementation (RLS Strategy)

Context Setting: Use Transaction-Scoped Settings (SET LOCAL app.current_store_id = ...).

Policy Enforcement: Postgres Row Level Security (RLS) on all tenant tables.

Migration Strategy: Use a specific overseek_admin role with BYPASSRLS attribute strictly for the migrator container.

1.5 Development Hygiene & Code Standards

Git Workflow:

Strategy: Trunk-Based Development with short-lived feature branches.

Commits: Conventional Commits (feat:, fix:, chore:) enforced via commitlint.

Pre-Commit: Husky hooks running lint-staged (Prettier + ESLint) to reject bad code before upload.

Anti-Bloat Strategy (File Limits):

Strict Rule: ESLint max-lines set to 300 lines. Forces developers to break monolithic files into smaller, reusable hooks/components.

Separation of Concerns: Business logic moves to custom hooks (useOrders.ts), UI stays in components (OrderTable.tsx).

Lazy Loading: Route-based splitting using React.lazy to keep the initial bundle lightweight.

2. The Data Model (PostgreSQL Schema)

Standard Columns: All tables include created_at, updated_at.
Soft Deletes: Core entities include deleted_at to preserve referential integrity.

2.1 Identity & Access

users: id, email (Index), password_hash (Argon2), totp_secret, default_store_id.

sessions: id, user_id, token_hash, expires_at, ip_address, user_agent.

mfa_recovery_codes: user_id, code_hash, used_at.

roles: id, name, store_id.

permissions: id, slug.

user_roles: user_id, role_id, store_id. Constraint: Unique (user_id, role_id, store_id).

2.2 Store & Secrets

stores: id (UUID), url, settings (JSONB).

store_credentials: store_id, consumer_key (Encrypted), consumer_secret (Encrypted).

Encryption: App-level Envelope Encryption (AES-256-GCM). Keys managed via environment secret.

2.3 Commerce Core (Hybrid Normalized)

customers:

id (UUID), store_id, wc_id (BigInt), email.

ltv, last_order_date.

Constraint: Unique (store_id, wc_id).

orders:

id (BigInt - WC ID), store_id, customer_id.

status, date_created, date_modified.

total (Numeric 12,2), currency.

billing (JSONB), shipping (JSONB), meta_data (JSONB).

deleted_at (Timestamp - Soft Delete).

Constraint: Unique (store_id, id).

order_items:

id, order_id, store_id, product_id, sku, quantity, subtotal.

FK: order_id references orders(id) ON DELETE CASCADE (logic handled via soft delete).

products:

id (WC ID), store_id, sku.

stock_quantity, price.

bin_location, supplier_id.

attributes (JSONB).

Constraint: Unique (store_id, id).

2.4 Operations & Analytics

inventory_logs: id, store_id, product_id, change, user_id.

sync_state: store_id, entity_type, last_synced_at, cursor_id.

webhook_deliveries: store_id, delivery_id (WC Header), processed_at. Constraint: Unique.

analytics_sessions: id, store_id, visitor_id, start_time, duration, utm_source.

analytics_events: id, session_id, type (pageview/click), data (JSONB).

3. The Sync Protocol (Engine V2)

3.1 Architecture: Hybrid Push/Pull

The "Delta" Pull (Reliability):

Trigger: Cron/Manual.

Order: modified_gmt ASC.

Pagination: Loop x-wp-totalpages.

Logic: Fetch items modified after last_synced_at. Update sync_state only on full page success.

The "Zombie" Reconciliation (Deletions):

Trigger: Nightly.

Query: Fetch list of IDs from WC for a time range.

Diff: Local IDs - Remote IDs = Deleted IDs.

Action: UPDATE orders SET deleted_at = NOW() WHERE id IN (Deleted IDs). Do not hard delete.

The "Real-Time" Push (Webhooks):

Endpoint: POST /api/webhooks/wc.

Verification: Hash raw body bytes with HMAC-SHA256. Use timingSafeEqual.

Idempotency:

Check webhook_deliveries table (or Redis with 30-day TTL).

If exists, return 200 OK immediately.

If new, store delivery ID and push to sync-queue.

PART 2: THE PRODUCT SPECIFICATION (FEATURES)

4. The Integrated Feature Matrix

🟢 Target A: The Brain (Metorik Replacement)

Function: Data Processing, Reporting, and Order Management.

Tiered Data Strategy (The Scalability Fix):

Hot Tier (Local/Dexie): Syncs "Actionable" data (Processing/On-Hold orders, Active Tickets). Configurable limit (Default: 5,000 active records).

Cold Tier (Remote/Postgres): Virtual Infinite Scroll for deep history using server-side cursors.

Hybrid Search: Search Input queries Local Index first -> Auto-escalates to Server (tsvector) if no match found.

Conflict Strategy: version_vector check. If Server Version > Local Version, prompt "Merge/Overwrite".

The "Hyper-Grid":

Instant Filtering: Client-side filtering for Hot Data (< 100ms).

Saved Segments: Dynamic tabs (e.g., "VIPs," "Failed Payments") saved to DB.

Bulk Actions: Status change, Export (CSV/PDF), Print.

Order Auto-Tagging Engine:

Rules: Regex triggers on import (e.g., "If SKU contains GL- -> Add tag Glassware").

Execution: Runs instantly on incoming webhooks/syncs.

Custom Field Highlighter (Crucial for Custom Gifts):

Meta Parsing: Automatically detects and highlights custom input fields (e.g., "Engraving Text", "Font Selection", "Photo Upload").

Operator View: Displays personalization text in Large, High-Contrast Type on the order screen to prevent production typos.

Variant Management (The Matrix):

Variant Folding: Main lists show Parent SKU only.

Matrix View: Inline editing of Stock/Price/Bin Location.

Bidirectional Sync: Updates push to WooCommerce via Webhook/API instantly.

Supply Chain Command:

Supplier CRM: Profiles, Lead Times, Default Currency.

Purchase Orders: Draft -> Sent (PDF) -> Partial Receive -> Completed.

Cost Averaging: Updates Moving Average Cost (MAC) on receipt.

Warehouse Operations:

Bin Location: Dedicated field per variant.

Audit Mode (Stock Take): A specialized mobile UI that re-orders the product list strictly by bin_location (A1 -> A2) to facilitate physical inventory counting.

Smart Pick Lists: Generates lists only for fully-stock orders.

Component Explosion: Replaces BOM Parents with Child components.

Route Optimization: Sorts list by Bin Location (A-Z).

Scanner Mode (The Wand): A dedicated mobile UI that listens for Bluetooth Barcode Scanners (HID). Scan an item -> System ticks it off the pick list -> Auto-prints label when list complete.

Advanced Inventory (Manufacturing BOM):

Blanks Management: Define "Raw Material" (e.g., Blank Glass) linked to "Finished Good" (Engraved Glass).

Deduction Logic: Selling 1x "Engraved Glass" deducts 1x "Blank Glass" from inventory.

Compliance & Optimization Engine:

SEO Auditor (RankMath Style): Live Scoring, SERP Preview, Keyword Analysis.

Schema Validator: Checks JSON-LD data for Product schema errors.

GMC Sentinel: Merchant Center audit (GTINs, Title Length, Image rules).

Image Audit: Checks resolution requirements (> 100x100px).

Dynamic Pricing (Gold Standard):

Commodity Linking: pricing:gold tags linked to XAU/USD.

Margin Protection: Circuit Breaker logic stops price updates if margin drops below defined threshold.

Auto-Update: Background job calculates (Weight * LivePrice) + Markup.

"The Oracle" (AI & RAG):

Text-to-SQL: Natural language queries via OpenRouter API.

RAG Pipeline: Vectorizes Help Docs/Reviews for context.

Dynamic Models: Settings toggle for GPT-4 / Claude 3.5 / Llama 3.

Token Budgeting (Cost Governance): Per-user or per-workspace spending limits on OpenRouter API calls.

Reporting Engine (The Scribe):

Studio: Server-Side Aggregation for large datasets (500k+ rows).

Calculated Fields: User-defined formulas (e.g., (Revenue - COGS) / AdSpend) that persist in the custom report.

Library: Pre-built templates.

Scheduling: Cron-based email reports.

🔴 Target B: The Nervous System (FunnelKit Replacement)

Function: Logic, Action, and Sequencing.

Automation Library:

Standard Triggers: Order Created/Refunded, Review Submitted, Cart Abandoned, Tag Added.

Extended Triggers:

Birthday: Fires on customer's birth date (from meta field).

Win-Back: Fires if customer hasn't ordered in X days.

Proofing: Triggers on Proof Approved or Proof Rejected.

Returns: Triggers on RMA Requested.

Event Bus (Extensibility):

Outgoing Webhooks: POST JSON payloads to external URLs (n8n/Zapier).

Visual Flow Builder (ReactFlow):

Nodes: Delays, Conditional Splits, A/B Testing, Action Nodes.

Graph Guard: Validation logic to prevent Infinite Cycles (A->B->A).

Visual Email Designer (The Artist):

MJML Engine: Drag-and-drop builder exporting responsive HTML.

Device Simulator: One-click toggle to render the email canvas in "Mobile (iPhone SE)" mode vs "Desktop" mode during editing.

Dynamic Contexts: Inject {{order.items}}, {{customer.name}}.

Reliability:

Idempotency: Prevent duplicate emails using unique Event IDs.

Provider Abstraction: Hot-swap SMTP/SES/Mailgun.

🔵 Target C: The Voice (Crisp Replacement)

Function: Communication and Presence.

Unified Inbox:

Channels: Email, Chat, WhatsApp.

Collaboration: CRDT typing indicators, Internal Notes.

Staff Presence: Real-time indicator showing if another agent is viewing the same ticket.

"The Closer" (Product Injection): Button in the chat interface to search products and inject a rich "Buy Now" card directly into the conversation stream.

Smart Canned Responses:

Shortcodes: /thx expands to "Thank you for your order!".

Folders: Categorized snippets.

Availability Engine:

Business Hours: Auto-switch to offline mode outside windows.

Auto-Pilot:

Instant Acknowledge: Immediate receipt confirmation.

Keyword Triggers: Regex matching for canned responses.

Reputation Manager:

Smart Linking: Matches Reviews to Orders via Email/SKU.

Verified Badge: Validates purchase history.

Customer Intelligence (Churn):

Leakage Alerts: Internal logic that tags customers as at_risk if they deviate from their personal Average Order Frequency.

Widget Designer:

Stylist: WYSIWYG editor for colors/text.

Sovereign: No branding.

🟠 Target D: The Eyes (Matomo Replacement)

Function: Observation and Attribution.

The Beacon:

Privacy Shield: Client-side PII redaction before upload.

Session Replay: rrweb based DOM recording.

Deep Identify (Bot Detection): Server-side analysis of User-Agent and IP behavior to tag sessions as Bot, Crawler, or Human.

Smart Sampling: Configurable logic to record 100% of Paid Traffic but only 10% of Organic Traffic.

Attribution Engine:

Touchpoints: First/Last Click UTM tracking.

Search Intelligence: A specific report tracking Zero-Result Searches (Terms users typed that yielded no products), vital for merchandising.

🟣 Target E: The Amplifier (Ad Tech)

Function: Growth, Paid Media Monitoring, and AI Strategy.

Unified Ad Dashboard:

Metrics: Blended ROAS, CPA, Spend across Meta/Google.

URL Builder: Utility tool to generate UTM-tagged links.

"The Strategist" (AI):

Profit-Aware Scaling: Suggests scaling only if Margin > CPA and Stock > Safety Level.

Kill Switch: Alerts when CPA exceeds Margin.

🟤 Target F: The Network (Affiliates)

Function: Referral Tracking.

The Ledger:

Tracking: ?ref= parameters and Coupon Code attribution.

Commission Engine: Flat/Percentage logic.

Payouts: Generate PDF "Due Sheets."

📖 Target G: The Knowledge Base (Wiki)

The Codex: Markdown-based internal wiki. Pin pages to specific views.

⚙️ Target H: System & Maintenance

Function: Operational Health.

The Janitor (Auto-Cleanup):

Retention Policies: Configurable TTL (Time To Live) for heavy data. (e.g., "Delete Session Replays > 60 days", "Prune Logs > 30 days").

Disk Watchdog: Alert admins if disk usage > 80%.

The Postmaster (Deliverability):

Bounce Handler: Webhook listeners for SES/Mailgun.

Logic: If event == bounced -> Update Customer to email_bounced status -> Pause all automations to that user.

Job Manager:

Retry UI: View failed background jobs (Sync, Email) and click "Retry" or "Flush."

Dead Letter Queue: Inspect payloads of permanently failed jobs.

Disaster Recovery (The Vault):

Encrypted Backups: Scheduled pg_dump encrypted with GPG.

Dry Run Analysis: "Pre-Flight" check to view data diffs/risks before executing a Restore operation.

🏭 Target I: The Workshop (Production & Customization)

Function: Manufacturing Workflow for Personalized Items.

Production Kanban:

Custom Statuses: Board columns mapped to local sub-statuses (e.g., New -> Artwork Prep -> Laser Engraving -> Quality Check -> Ready to Pack).

Job Cards: Printable "Traveller" cards (PDF) with high-res artwork thumbnails and large text for factory floor usage.

Asset Manager (The Repository):

File Sync: Scrapes uploaded files (from plugins like "WooCommerce Uploads") and stores them in MinIO.

Preview: High-res modal to view/zoom customer photos without downloading.

"The Easel" (Proofing System):

Workflow: Designer uploads a "Proof" image -> System emails Customer a secure link -> Customer clicks "Approve" or "Request Change".

Gatekeeper: Automatically locks the order status to "On Hold" until approval is received.

📦 Target J: The Dispatch (Logistics)

Function: Shipping, Labeling, and Returns.

The Courier Bridge:

Rate Shopping: Integrations with aggregators (Shippit, Starshipit, EasyPost).

Label Generation: One-click print from the Order or Kanban view (PDF/ZPL).

Tracking Sync: Auto-posts tracking numbers back to WooCommerce + Email Trigger.

Address Sentinel:

Validator: Google Places API pre-check on import to flag invalid addresses (preventing RTS fees).

RMA Portal (Self-Serve Returns):

Customer View: "Magic Link" portal where customers select items to return and upload photos of damage.

Smart Approval: Auto-approve damage claims based on image recognition or logic.

📊 Target K: The Scorecard (Staff Performance)

Function: Employee Accountability & Gamification.

Activity Tracking: Logs every action (Pick, Pack, Ticket Close, Artwork Upload) by User ID.

Leaderboards: "Most Orders Packed Today," "Fastest Ticket Resolution."

Error Rate: Tracks returns/RMA flagged as "Packing Error" back to the original packer.

💰 Target L: The Treasury (Financials)

Function: Advanced Financial Health.

Tax Engine:

Offline Cache: Fetches wc/v3/taxes to Dexie for offline calculations in the Invoice Designer.

Report: Liability breakdown by Country/State/County.

Profit & Loss:

Real-time Net: Revenue - (COGS + Shipping + Tax + AdSpend + Affiliate Comm).

PART 3: THE INTERFACE & OPS

5. Sitemap & Navigation

5.1 Command Center

Modular Widget Grid: React-Grid-Layout dashboard.

Widget Library (The Catalog):

Financials: Gross Sales, Net Sales, Net Profit, Discounts, Tax, Shipping.

Orders: Order Count (Graph), AOV Meter, Failed Orders List, Orders by Country (Heatmap).

Inventory: Low Stock Alerts, Out of Stock Count, Incoming Stock Value (PO).

Live Activity: Real-Time Visitor Count, Active Carts (Count & Value), Chat Queue Depth.

Marketing: Blended ROAS, Total Ad Spend, CAC, Email Open Rates.

Operations: Pending Tasks Count, Returns to Process, Sync Health Status (Latency).

AI: "The Oracle" Quick Input, Daily Insights Summary Card.

Real-Time Log: Streaming event feed.

Task Command: Kanban board for internal ops.

5.2 Commerce Engine

Orders: Hyper-Grid.

Products: Catalog, SEO/GMC Audit, Inventory/BOM.

Purchasing: Suppliers, POs.

Tools: Invoice Designer.

5.3 Operations (The Workshop & Dispatch)

Production: Kanban Board (Artwork -> Machine -> QC).

Proofing: Approval Dashboard.

Files: Asset Manager.

Shipping: Label Station, RMA Portal.

5.4 Customer Intelligence

Inbox: Unified Stream.

Customers: CRM.

Reviews: Reputation Manager.

Network: Affiliates.

5.5 Growth

Paid Media: Ad Dashboard.

Automations: Flow Builder.

Campaigns: Email Templates, Coupons.

5.6 Analytics

Reports: Library, Studio, Scheduled.

Forecasting: Cash Flow, Stock Velocity.

Staff: Scorecards & Leaderboards.

Financials: P&L, Tax Reports.

5.7 System

Team: RBAC.

Settings: Sync, Mail, Integrations, Compliance, Billing.

Modules: Feature Flags.

Maintenance: Janitor Policies, Job Manager.

Lifecycle: Updates.

6. The Glue (UX & Ops)

6.1 Multi-Tenancy & Modularity

Workspace Switcher: Session-based context switching.

Module Switchboard: Disable unused targets to stop background containers.

6.2 Design System

Theming Engine:

Modes: Light, Dark, and System Sync.

Implementation: CSS Variables (--glass-bg, --text-primary) via React ThemeProvider.

Adaptive Glassmorphism: Frosted glass opacity automatically adjusts.

Mobile PWA: Manifest, Bottom Tabs, "Card View" transformers.

Nav Ergonomics: Pin favorites, Role-based hiding.

6.3 Onboarding

Wizard: Admin Creation -> Store Connect -> Sync -> SMTP.

Importers: Crisp/Metorik Data migration tools.

6.4 Security & Connectivity Guardrails

Smart Failover: Logic: Try Direct API -> If Fail, Try Proxy -> If Fail, Show Offline Mode (Read-only Dexie).

Localhost Lock: Admin API routes (/api/admin/*) reject requests from non-local IPs unless explicitly whitelisted via ALLOW_CIDR env var.

Rate Limiter: redis-rate-limiter config: Window 15m, Max 500 reqs per IP.

PART 4: EXECUTION PLAN

7. Development Phases

Phase 0: The Bedrock

Repo: Monorepo Setup (TurboRepo/Nx).

Infra: Docker Compose + Traefik.

CI: GitHub Actions (Lint/Test/Build).

Docs: Storybook setup for UI component documentation.

Phase 1: The Iron Core

DB: Schemas (Users, Stores, Orders, Vectors).

Auth: Argon2 + Session Cookies + Passkeys.

Sync Engine V2:

Queue: BullMQ Worker setup.

Logic: Delta Sync + Zombie Reconciliation + Webhook Listener + HMAC Validator.

Merge UI: Conflict Resolution Interface.

Phase 2: The Application Shell

UI: Shadcn/UI integration.

Theming: Light/Dark/System toggle logic + Persistence.

Data: Dexie + TanStack Query hooks.

PWA: Service Worker registration.

Phase 3: The Brain (Commerce)

Features: BOM, Pick Lists, Pricing Worker, SEO/GMC logic.

AI: OpenRouter API wrapper.

Phase 4: The Nervous System (Auto)

Canvas: ReactFlow implementation with Cycle Guard.

Email: MJML renderer.

Events: Outgoing Webhook dispatcher.

Phase 5: The Workshop & Logistics

Logic: Custom Status Mapping, Asset Scraper.

UI: Kanban Board, Job Card PDF Generator.

Scanner: Barcode Mode (HID Listener).

Dispatch: Label API Integration & RMA Portal.

Phase 6: The Voice & Network

Realtime: Socket.io Namespace.

Chat: Widget Logic + Availability + Product Injection.

Affiliates: Tracking Middleware.

Phase 7: Eyes, Shield & Amplifier

Analytics: Beacon Script + Redactor + Smart Sampling.

Compliance: DSR "Nuke" button.

Ads: Meta/Google API Jobs.

Admin: Module Switchboard.

Staff: Scorecard Logic.

Phase 8: The Maintenance Crew (System Health)

The Janitor: Cron jobs for data retention/pruning.

The Job Manager: UI for BullMQ (Retry/Fail/Flush).

The Sandbox: Logic to trap outgoing emails in staging environments.

The Treasury: Tax Engine caching & P&L Calcs.

8. Pre-Flight Checklist (QA)

Leak Test: gitleaks scan.

Chaos Test: Docker kill simulation.

Load Test: 50k Orders in Postgres, 5k in Dexie.

Mobile Audit: iPhone/Android PWA verification.

Security: HMAC & RLS verification.

Recovery: Backup/Restore drill.

PART 5: RISK & MITIGATION MATRIX

9. Failure Scenarios

🔴 High Risk Scenarios

1. Sync Lag

Detection: last_synced_at > 1 hour.

Mitigation: Delta Sync catches up on reconnection. Webhooks provide real-time buffer. UI shows persistent "Syncing..." spinner.

2. API Limit Hit

Detection: WC API returns 429 Too Many Requests.

Mitigation: Exponential Backoff strategy in BullMQ. Strict Rate Limiter compliance in app-worker.

3. Email Spam / Blacklist

Detection: Bounce Rate > 5%.

Mitigation: The Postmaster pauses sending to bounced addresses immediately. Sandbox Mode prevents accidental sends from staging environments.

4. Secrets Leak

Detection: Automated Git Scan / Secret Scanning.

Mitigation: Encrypted Columns in DB. No .env secrets in repo. Usage of Docker Secrets for runtime injection.

5. Security Breach (Webhook)

Detection: Unauthorized Webhook request.

Mitigation: HMAC Signature mandatory check. Rejects any request without a valid signature signature.

🟡 Medium Risk Scenarios

6. Browser Crash (OOM)

Detection: Browser Memory Warning / crash reports.

Mitigation: Tiered Data Strategy. Hard cap on local IndexedDB records (5k). Auto-prune old records to keep heap size low.

7. Data Conflict

Detection: version_vector mismatch during sync.

Mitigation: Merge UI prompts user to resolve. "Server Wins" default policy for background updates.

🟢 Low Risk Scenarios

8. Zombie Data

Detection: Count mismatch between Local and Remote.

Mitigation: Nightly Reconciliation job diffs IDs and soft-deletes missing records.go 