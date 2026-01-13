# Future Work & Roadmap

This document tracks planned enhancements, known bugs, and future feature ideas for the OverSeek platform.

---

## Implemented

- [x] **Revenue Anomaly Alerts (PWA)** — Real-time detection when revenue is ±25% from 7-day baseline
  - Green banner for positive spikes, amber for dips
  - Integrated into mobile dashboard

---

## Planned

### Marketplace Sync
- [ ] **Amazon/eBay Inventory Sync**
  - Two-way stock sync
  - Order import from marketplaces
  - Unified product catalog

---

### PWA Enhancements

- [ ] **Push Notification for Anomalies** — Send push alert when revenue anomaly detected

---

### Backend & Infrastructure

- [ ] **Webhook Event Replay** — Replay failed webhook deliveries from admin panel
- [ ] **Multi-tenant Rate Limiting** — Per-account API rate limiting with BullMQ
- [ ] **Database Read Replicas** — Horizontal scaling for analytics queries

---

### AI & Intelligence

- [ ] **Smart Reorder Suggestions** — Predict optimal reorder quantities from sales velocity
- [ ] **Sentiment Analysis (Reviews)** — Auto-categorize review sentiment for prioritization

---
PWA App
