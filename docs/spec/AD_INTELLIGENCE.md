# Domain Logic: Ad Intelligence System

## Overview
The Ad Intelligence system correlates **local sales data** (from WooCommerce) with **external ad spend data** (Meta/Google Ads) to calculate Real-Time ROAS (Return on Ad Spend) and generate AI-driven optimizations.

## Data Sources
1.  **Internal:** `orders` table (Dexie/Postgres).
2.  **External:** `/api/marketing/integrations` (Proxy to Meta Graph API / Google Ads API).

## Key Metrics Calculation
Calculated client-side in `Marketing.tsx`:
*   **Total Ad Spend:** Sum of `spend` from all active campaigns.
*   **Total Revenue:** Sum of `total` from `orders` within the same date range.
*   **ROAS:** `Total Revenue / Total Ad Spend`.
*   **CTR:** `(Clicks / Impressions) * 100`.

## AI Optimization Engine
The engine analyzes the correlated data to generate "Cards" (`apps/web/src/pages/Marketing.tsx`):
1.  **Inventory Protection:** Checks if an active Ad Campaign is promoting a product with `stock_quantity < 5`.
    *   *Action:* Suggests "Pause Ad Set".
2.  **High Margin Scaler:** Identifies products with High Margin (>50%) and High Review Score (>4.5).
    *   *Action:* Suggests "Increase Budget".

## Integration Status
*   **Meta:** Uses OAuth flow via backend (`ad_integrations` table).
*   **Google:** USes OAuth flow.
*   **Status:** "Active" flag stored in PostgreSQL.
