# Debug Status Log

## Phase 0: State & Safety
- **Date:** 2026-01-06
- **Issue:** WooCommerce Plugin Configuration 401 Unauthorized
- **Git Status:** Clean

## Phase 1: Isolation & Reproduction
- **Hypothesis:** The client is not sending the correct credentials (consumer key/secret) to the server, or the server is not passing them correctly to WooCommerce, or the credentials themselves are invalid/expired.
- **Trace:**
    1. User clicks "Configure" in `GeneralSettings.tsx`.
    2. Request goes to `/api/woo/configure`.
    3. Server attempts to contact WooCommerce API via `WooService.updatePluginSettings`.
    4. WooCommerce returns 401. 
    5. `server/src/routes/woo.ts` handles the error and returns 500 to client with details.
- **Findings:**
    - Plugin source located at `overseek-wc-plugin`.
    - Custom endpoint: `overseek/v1/settings`.
    - `permission_callback` was strictly requiring `manage_options` (Admin).
    - **Root Cause:** If the API keys belong to a Shop Manager (who has `manage_woocommerce`), the request fails with `rest_forbidden` (401).

## Phase 2: The Fix Loop
- **Attempt 1:**
    - Relaxed `permission_callback` in `class-overseek-api.php` to accept `manage_woocommerce`.
    - Status: API code modified.
    - **Action:** Rebuilding plugin using `scripts/build_plugin.ps1`.
- **Attempt 2:**
    - User noted `overseek-integration-single.php`.
    - Found identical strict permission check.
    - Status: Applied fix to single-file version as well.
    - **Outcome:** User still reports 401.
    - **Action:** Adding server-side pre-check (`getSystemStatus`) to verify credentials. This will isolate if the issue is *Bad Keys* vs *Plugin Permissions*.
