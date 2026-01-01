# Authentication & Security

## 1. Authentication Flow
The application uses a **Session-based** auth mechanism with HttpOnly cookies.

1.  **Login**: User posts credentials to `/api/auth/login`.
2.  **Verification**: Backend verifies `password_hash` (Argon2).
3.  **Session Creation**:
    *   A unique Session ID is generated.
    *   Stored in PostgreSQL `sessions` table.
    *   Sent to browser as `sessionId` cookie (HttpOnly, Secure, SameSite=Lax).
4.  **Verification**: Middleware checks `request.cookies.sessionId` against `sessions` table.

## 2. Multi-Tenancy (Accounts)
Users can belong to multiple "Stores" (Accounts).
-   **Frontend**: `AccountContext.jsx` manages the active account ID.
-   **Backend**: Every data request must include `account_id` header or query param (enforced by middleware).
-   **Isolation**: Drizzle queries inject `.where(eq(schema.accountId, currentAccountId))` to prevent data leaks.

## 3. Role-Based Access Control (RBAC)
Roles are defined in the `roles` table.
-   **Permissions**: Currently, roles are names (e.g., 'Admin', 'Staff').
-   **Frontend Guard**: `<PermissionGuard requiredPermission="view_settings" />`
    -   Detailed permission mapping is handled in `apps/web/src/utils/permissions.js` (implied).

## 4. API Security
-   **Proxy**: The dedicated proxy (`/api/proxy`) ensures API Keys (`consumer_key`, `consumer_secret`) are **never exposed** to the frontend.
-   **CORS**: Configured in Fastify to allow only trusted domains.
