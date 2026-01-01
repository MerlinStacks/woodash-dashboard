# Services Layer Documentation

## Overview
The `apps/web/src/services` directory contains the application's interface to external systems (Backend API, Browser IO).

## Modules

### 1. `api.js` (Backend Bridge)
*   **Role:** Axios Singleton wrapper.
*   **Features:**
    *   **Interceptors:** Auto-injects `Authorization` headers if needed (though Cookie auth is primary).
    *   **Error Handling:** Centralized response parsing.
    *   **Endpoints:** `createCoupon`, `fetchSettings`, `syncTrigger`.

### 2. `backupService.js` (Data Portability)
*   **Role:** JSON Export/Import engine.
*   **Logic:**
    *   **Export:** Dumps all Dexie tables to a single JSON blob.
    *   **Import:** Validates schema version -> Clears DB -> Bulk Adds records.
    *   **Safety:** Uses `transaction('rw')` to prevent partial corruptions.

### 3. `reportService.js` (PDF Preparation)
*   **Role:** Prepares data structures for the **Invoice Generator**.
*   **Logic:** Formats raw Order objects into the standard `PREVIEW_DATA` structure expected by `InvoiceBuilder`.

## Backend Utilities (`apps/api/src/analytics/redactor.ts`)
*   **Role:** PII Scrubber.
*   **Function:** Removes sensitive fields (`email`, `address`, `phone`) from analytics logs before they are stored or processed by third-party tools.
