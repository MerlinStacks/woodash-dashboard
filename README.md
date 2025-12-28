# WooDash - Modern WooCommerce Intelligence Dashboard

![WooDash Banner](https://via.placeholder.com/1200x400?text=WooDash+Dashboard+Preview)

**WooDash** is a high-performance, real-time analytics and management dashboard for WooCommerce. Built with a "Local-First" architecture, it provides instant insights, real-time presence collaboration, and advanced reporting without slowing down your live store.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Image Size](https://img.shields.io/docker/image-size/merlinstacks/woodash-dashboard/latest)](https://hub.docker.com/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 🚀 Key Features

-   **⚡ Real-Time Analytics:** Live stream of sales, visitors, and cart activity via WebSockets.
-   **👥 Team Presence:** See who else is viewing a product or order in real-time to prevent collisions.
-   **📊 Advanced Reporting:** Custom report builder with drag-and-drop metrics and visual graphs.
-   **🔌 Service Integrations:** Connect external AI models (OpenRouter) and lifestyle apps (Fitbit, Waze) for contextual insights.
-   **🛡️ Enterprise Security:** Robust role-based access, audit logging, and secure Nginx proxying.
-   **🐳 Docker Ready:** One-click deployment to Portainer or any Docker environment.

## 🛠️ Tech Stack

-   **Frontend:** React 19, Vite, Recharts, Lucide Icons, Glassmorphism UI.
-   **Backend:** Node.js, Express, Socket.io.
-   **Database:** PostgreSQL (Data), Redis (Caching/PubSub).
-   **Infrastructure:** Docker Compose, Nginx Reverse Proxy.

## 📦 Installation

### Option A: Quick Start (Portainer / Docker)

1.  Clone this repository.
2.  Deploy the stack using `docker-compose.yml`.
3.  Access the dashboard at `http://your-server:5173`.

```yaml
version: '3.8'
services:
  app:
    image: woodash:latest
    ports:
      - "5173:80"
```

### Option B: Local Development

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/MerlinStacks/woodash-dashboard.git
    cd woodash-dashboard
    ```

2.  **Start dependencies (DB & Redis):**
    ```bash
    docker-compose -f docker-compose.dev.yml up -d db redis
    ```

3.  **Install & Run Backend:**
    ```bash
    cd server
    npm install
    npm run dev
    ```

4.  **Install & Run Frontend:**
    ```bash
    # New terminal
    npm install
    npm run dev
    ```

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🔒 Security

For security concerns, please review our [Security Policy](SECURITY.md).
