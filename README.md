# OverSeek v2 🚀
### **Stop Overpaying. Start OverSeeking.**

**The Premium, Self-Hosted E-Commerce Intelligence Dashboard.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-production-green.svg)
![Stack](https://img.shields.io/badge/stack-PERN-blueviolet)

---

## 💡 Why OverSeek?

Are you tired of paying **$200+/month** for analytics tools like Metorik, Glew, or Kissmetrics?

OverSeek v2 is the open-source answer. It puts the power of enterprise-grade e-commerce intelligence back in your hands—**for free**.

*   **Own Your Data:** No third-party silos. Your data lives on your server.
*   **Real-Time Intelligence:** Instant order updates via Socket.io.
*   **Predictive Analytics:** Forecasting algorithms that actually work.
*   **Lightning Fast:** Powered by Elasticsearch for sub-second queries on millions of orders.

## ✨ Features that Scream "Premium"

*   **📊 Advanced Analytics:** Beautiful, interactive charts powered by Recharts. Track Sales, AOV, LTV, and more in real-time.
*   **🔄 Deep WooCommerce Sync:** Robust robust synchronization engine. Never miss an order.
*   **🔍 Instant Search:** Elasticsearch-backed global search. Find any customer, order, or product in milliseconds.
*   **📧 Unified Inbox:** Manage customer emails directly within the dashboard (IMAP support).
*   **🌍 Geo-Intelligence:** Visualized customer locations with built-in GeoIP mapping.
*   **⚡ Background Processing:** Heavy lifting handled by BullMQ & Redis queues specifically designed for high volume.

## 🛠️ The Power Stack

Built with modern, battle-tested technologies:

*   **Frontend:** React (Vite), Tailwind CSS, React Query
*   **Backend:** Node.js (Express), TypeScript, Socket.io
*   **Data:** PostgreSQL (Prisma ORM), Elasticsearch, Redis
*   **Infrastructure:** Docker & Docker Compose ready

## 🚀 Quick Start

Get up and running in minutes.

### Prerequisites
*   Node.js 18+
*   Docker & Docker Compose

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MerlinStacks/overseek.git
    cd overseek
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the stack (Database, Elastic, Redis):**
    ```bash
    docker-compose up -d
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

    *   Frontend: `http://localhost:5173`
    *   Backend: `http://localhost:3000`

## 📂 Project Structure

```
overseek-v2/
├── client/                 # React (Vite) Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Tailwind)
│   │   ├── services/       # API Integration
│   │   └── pages/          # Dashboard Views
│   └── package.json
├── server/                 # Node.js (Express) API
│   ├── src/
│   │   ├── jobs/           # BullMQ Background Jobs
│   │   ├── services/       # Business Logic & Sync
│   │   └── prisma/         # Database Schema
│   └── package.json
├── docker-compose.yml      # Infrastructure Orchestration
└── package.json            # Monorepo Workspace Config
```

## 🤝 Contributing

We believe in open source. Found a bug? Want to add a feature?
1. Fork it.
2. Branch it (`git checkout -b feature/my-feature`).
3. Commit it (`git commit -m 'Add My Feature'`).
4. Push it (`git push origin feature/my-feature`).
5. Pull Request it.

---

**Built with ❤️ for E-Commerce Merchants who demand better.**
