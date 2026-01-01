# Deployment Guide

## Infrastructure
The application is containerized using Docker and orchestrated via Docker Compose.

### Containers
1.  **`app-api` (Backend)**
    *   **Port:** 4000
    *   **Image:** `node:22-alpine`
    *   **Build:** Multi-stage (Install all -> Build -> Prune -> Copy dist).
2.  **`app-web` (Frontend)**
    *   **Port:** 8080 (Mapped to host)
    *   **Image:** `nginx:alpine`
    *   **Build:** React build (`npm run build`) copied to Nginx html folder.
3.  **`db` (Database)**
    *   **Image:** `postgres:16`
4.  **`redis` (Cache)**
    *   **Image:** `redis:alpine`

## Nginx Configuration (`apps/web/nginx.conf`)
The Nginx container serves the static React assets and acts as a **Reverse Proxy** for the backend.
*   `location /`: Serves `index.html` (Supports HTML5 History Mode via `try_files`).
*   `location /api/`: Proxies to `http://backend:4000`.
*   `location /socket.io/`: Proxies WebSocket connections.

## Production Checklist
1.  **Environment Variables:**
    *   Rename `.env.example` to `.env`.
    *   **CRITICAL:** Change `COOKIE_SECRET` and `POSTGRES_PASSWORD`.
2.  **Build & Run:**
    ```bash
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    ```
3.  **Database Migration:**
    *   The backend automatically runs Drizzle migrations on startup.

## Troubleshooting
*   **"Container unhealthy":** check logs `docker logs dashboard-app-api-1`. Often due to missing `dist/` (Fixed in v2).
*   **"502 Bad Gateway":** The backend container is down or starting up. Nginx cannot reach port 4000.
