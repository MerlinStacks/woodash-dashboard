# Miscellaneous Utilities & Scripts

## 1. Database Seeding (`apps/api/src/seed.ts`)
A standalone CLI script (`npm run seed`) used to initialize a fresh database.
*   **Default Store:** Creates a store 'My Store' (localhost).
*   **Roles:** Creates standard roles (`admin`, `manager`, `editor`).
*   **Admin User:** Creates `admin@example.com` / `password123` if not exists.

## 2. Shared Libraries (`apps/web/src/lib/`)
*   **`analytics.ts`**: Frontend event tracking wrapper.
    *   *Functions:* `trackEvent(name, properties)`, `identifyUser(id, traits)`.
    *   *Abstraction:* Currently logs to console, but designed to swap in Segment/Mixpanel easily.
*   **`utils.ts`**: Tailwind `cn()` helper (Clsx + TailwindMerge).

## 3. Middleware (`apps/api/src/middleware/auth.ts`)
*   **Function:** `requireAuth(request, reply)`.
*   **Logic:**
    1.  Reads `sessionId` cookie.
    2.  Checks DB for valid session.
    3.  Attaches `req.user` to the request context.
    4.  Throws `401 Unauthorized` if invalid.
