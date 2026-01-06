# Overseek: The Sovereign Commerce Operating System
## Ultimate Reference Manual & Feature Guide

**Last Updated:** January 2026
**Version:** 2.0 (Iron Core)

---

## 1. Introduction & Philosophy

**Overseek** is a sovereign, self-hosted commerce operating system designed to replace disjointed SaaS tools with a unified, high-performance "Iron Core."

### The "Iron Core" Philosophy
1.  **Sovereignty First**: You own your database. There are no third-party data silos.
2.  **Instant Speed**: We use a "Tiered Storage" architecture.
3.  **Unified Intelligence**: A single mesh where customer support acts on inventory patterns.

---

## 2. Infrastructure & Architecture

### 2.1 The Tech Stack - Component Breakdown
*   **Frontend**: React 19, Vite.
*   **State**: React Context (`SocketContext` for lightweight event bridging).
*   **Backend**: Internal API (Fastify).
*   **Dynamic Chat Widget**: The chat widget behavior is NOT static. It is dynamically generated (`router.get('/widget.js')`) by the server to execute server-side logic (e.g., Business Hours, Blocked IPs) before the client even loads.

### 2.2 Background Workers
*   **Inline Polling**: Key system "Heartbeats" (Automation Ticker, Cart Abandonment) run directly on the main Express event loop for simplicity vs. heavy worker reliance.

### 2.3 Middleware & Security
*   **Rate Limiting**: 2000 requests / 15 mins.
*   **Dynamic CSP**: `Helmet` is configured to allow the dynamic injection of the Chat Widget script.

---

## 3. Integration Protocols

### Protocol A: Live Analytics & Chat Injection
*   **Mechanism**: The `widget.js` endpoint serves a dual purpose:
    1.  **Analytics Tracking**: Injects `__os_vid` cookies for visitor identification.
    2.  **Chat UI**: Renders the Shadow DOM chat interface.
*   **Optimization**: The entire widget checks for active business hours on the server-side, preventing the UI from rendering at all if the store is closed, saving client resources.

### Protocol B: Core Sync Engine
*   **Strategy**: Handshake-based Delta Sync.

---

## 4. Feature Modules (The A-Z Guide)

### 📊 Analytics & Growth
*   **Live Vitals Monitor**: Real-time dashboards.
*   **Attribution Modeling**: UTM tracking.

### 🤖 Automation & Marketing
*   **Visual Flow Builder**: A pure-UI node editor built on `React Flow`. It handles visual graph construction (`FlowBuilder.tsx`), while the heavy logic (loop detection, condition evaluation) is offloaded to the server's `AutomationEngine`.
    *   **Drag-and-Drop Nodes**: Trigger, Action (Email), Delay, Condition.
*   **Validation**: The server validates flow integrity (Max 20 steps) at runtime, not save time.

### 💬 Communication Mesh (Unified Inbox)
*   **Dynamic Chat Widget**:
    *   **Auto-Open**: Automatically opens for returning visitors with active conversations.
    *   **Optimistic UI**: Messages appear instantly before server confirmation.
    *   **Polling Fallback**: Uses simple polling (5s interval) as a robust fallback to Socket.io.

### 🧠 Intelligence Oracle (Heuristics)
*   **OmniSearch**: Elasticsearch-backed.
*   **Inventory Alerts**: Code-based heuristics.

### 🏭 Operations & Fabrication
*   **Audit Mode**: Mobile-optimized stocktake.
*   **Gold Price Service**: Real-time feed.

### 🛠️ Administration & Maintenance
*   **System Health UI**: Manual log clearing and diagnostic tools.
*   **Maintenance Scripts**: CLI tools for power users.

---

## 5. Roadmap vs. Reality

### ✅ Implemented (Reality)
*   **Core**: Full "Iron Core" stack.
*   **Chat**: Dynamic server-side widget generation (`widget.ts`).
*   **Automation**: Server-side execution engine (`AutomationEngine.ts`).

### 🚧 Roadmap (Vision)
*   **Client-Side Flow Validation**: Visual feedback for broken loops in the Flow Builder (currently server runtime only).
*   **The Janitor**: Automated background pruning.
*   **Neural AI**: Predictive modeling.

---

*This document serves as the master source of truth for the Overseek ecosystem.*
