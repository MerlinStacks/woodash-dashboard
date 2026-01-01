# Analytics Engine Specification

## Overview
The Dashboard's analytics are processed **entirely client-side** using `useStats.js`. This approach leverages the Local-First architecture to provide instant feedback without expensive backend aggregation queries.

## Core Logic (`useStats.js`)

### 1. Data Retrieval Strategy
*   **Smart Fetching:**
    *   If `days > 1000` (All Time): Fetches `db.orders.toArray()`.
    *   Otherwise: Uses Dexie Index `db.orders.where('date_created').aboveOrEqual(startDate)`.
*   **Cost Lookups:**
    *   Fetches unique Products found in the orders to create a `Product ID -> Cost Price` Map.

### 2. Metrics Calculation
Iterates through every order in memory:
*   **Revenue:** `SUM(order.total)` where status is `completed` or `processing`.
*   **Cost of Goods (COGS):** `SUM(item.quantity * product.cost_price)`.
*   **Gross Profit:** `Revenue - COGS`.
*   **Margin:** `(Profit / Revenue) * 100`.

### 3. Comparison Logic
Comparing periods (e.g., "This Month" vs "Last Month") is handled by simulating two time windows:
*   **Current Window:** `[Start, End]`
*   **Previous Window:** `[Start - Range, End - Range]`
*   **Delta Calculation:** `((Current - Previous) / Previous) * 100`.

### 4. Chart Aggregation
Data is flattened into a daily time-series Map `Date -> { sales, profit, prevSales }`.
*   **Handling Gaps:** The hook pre-fills the Map with 0-values for every day in the range to ensure continuous lines in `Recharts`.

## Limitations
*   **Memory:** Heavy for stores with >50k orders (processed in main thread). Web Worker offloading is planned.
*   **Currency:** Currently assumes single currency (summation is raw).
