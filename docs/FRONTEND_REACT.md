# Frontend Documentation (React + Vite)

## Project Structure
- `src/pages/`: Route components (Views).
- `src/components/`: Reusable UI bricks.
- `src/context/`: Global state (Auth, Sync, Settings).
- `src/db/`: Dexie.js schema and query logic.
- `src/workers/`: Web Workers for background tasks.

## Key Pages

### Commerce
- **DashboardHome** (`/`): Main overview.
- **Orders** (`/orders`): The "Hyper-Grid" order manager. Uses virtual scrolling.
- **Inventory** (`/inventory`): Advanced product/stock management.
- **Customers** (`/customers`): CRM view.

### Analytics
- **Analytics** (`/analytics`): Performance graphs (Recharts).
- **VisitorLog** (`/visitors`): Real-time traffic inspector.
- **Forecasting** (`/analytics/forecasting`): Predictive stock models.

### Tools
- **InvoiceBuilder** (`/invoices/builder`): Drag-and-drop PDF designer.
- **EmailFlowBuilder** (`/automations/new`): ReactFlow-based automation editor.

## State Management (The Brain)

The frontend uses a tiered state strategy to balance performance and real-time updates.

### 1. Global Contexts (`src/context/`)
-   **`AuthProvider`**:
    -   Stores `user` object.
    -   Methods: `login()`, `logout()`.
    -   Initialized by calling `/api/auth/me` on mount.
-   **`AccountContext`**:
    -   Stores `accounts[]` and `activeAccount`.
    -   **Critical**: Switching accounts updates `activeAccount` which triggers a re-fetch of all dashboard data (via `useEffect` dependencies in pages).
-   **`SyncContext`**:
    -   The bridge to `sync.worker.js`.
    -   Listens for `PROGRESS` events to update the `SyncOverlay`.
    -   Triggers database writes (Dexie) efficiently off the main thread.
-   **`PresenceContext`**:
    -   Socket.io wrapper.
    -   Emits `join_room` events when user navigates to an Order or Product.
    -   Receives `user_joined` events to show avatars in the header.

### 2. Local Database (Dexie.js)
We use `dexie-react-hooks` (`useLiveQuery`) to bind components to the database.
-   **Reactive**: When the Sync Worker updates the DB, the UI updates *automatically*.
-   **Performance**: Large lists (Orders) use `useLiveQuery` with `.offset()` and `.limit()` for pagination.

## Styling
Tailwind CSS is used for layout, but specialized "Glassmorphism" effects are defined in `index.css`:
- `.glass-panel`: Standard card background.
- `.glass-card`: Interactive card.
- `.btn-primary`: Gradient action buttons.
