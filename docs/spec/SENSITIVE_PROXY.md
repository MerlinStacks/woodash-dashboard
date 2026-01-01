# Technical Spec: Sensitive Proxy

## Problem
WooCommerce APIs require consumer keys/secrets (`ck_...`, `cs_...`).
1.  **Security Risk:** We cannot store these secrets in the Frontend code (React).
2.  **CORS:** Many WooCommerce stores block Cross-Origin requests from the Dashboard.

## Solution: The Fastify Proxy
A dedicated backend module (`apps/api/src/routes/proxy.ts`) acts as a secure tunnel.

## Flow
1.  **Frontend Request:**
    *   Target: `POST /api/proxy/wc/v3/orders`
    *   Headers: `x-store-url: https://target-store.com`
    *   **NO** Auth headers sent from Client (Cookie-based Session used instead).
2.  **Middleware:**
    *   Looking up the credentials for `x-store-url` from the `store_credentials` database table.
3.  **Proxy Forwarding:**
    *   Constructs destination: `https://target-store.com/wp-json/wc/v3/orders`
    *   Injects Auth: `Basic base64(ck_...:cs_...)`
    *   Relaxed SSL: (`rejectUnauthorized: false`) handles self-signed certs common in local dev.
4.  **Response:**
    *   Streams response back to Frontend.

## Routes Mapped
The Proxy logic intelligently routes based on path prefix:
-   `/wp/v2/*` -> WP REST API (Posts, Media)
-   `/overseek/v1/*` -> Custom Plugin Endpoints
-   `/*` (Default) -> WooCommerce V3 API

## Security Considerations
-   **Rate Limiting:** Should be enabled to prevent abuse.
-   **Scope:** The proxy allows `/*` which gives full API access. RBAC should filter allowed endpoints at the proxy level in the future.
