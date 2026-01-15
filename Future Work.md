# Future Work & Roadmap

This document tracks planned enhancements, known bugs, and future feature ideas for the OverSeek platform.

---

## Implemented

---

## Planned

### Marketplace Sync
- [ ] **Amazon/eBay Inventory Sync**
  - Two-way stock sync
  - Order import from marketplaces
  - Unified product catalog

---

### Shipping & Logistics

- [ ] **Auspost Carrier Integration**
  - Live tracking integration in order detail
  - Shipping label generation from dashboard
  - Delivery exception alerts (notify on delays)
  - Rate lookup and comparison

---

### PWA Enhancements

- [ ] **Push Notification for Anomalies** — Send push alert when revenue anomaly detected
- [ ] **Offline Order Viewing** — View recent orders without connection (sync queue on reconnect)
- [ ] **Quick Actions Widget** — Home screen widget for order count, new messages

---

### AI & Intelligence

- [ ] **Smart Reorder Suggestions** — Predict optimal reorder quantities from sales velocity
  - Lead time awareness from supplier data
  - Cash flow-aware ordering windows
  
- [x] **Predictive Inventory Forecasting** — AI-powered demand prediction
  - Forecast by SKU using historical sales, seasonality, market trends
  - Stockout risk alerts before they happen (proactive vs reactive)
  
- [ ] **Sentiment Analysis (Reviews)** — Auto-categorize review sentiment for prioritization
  - Theme extraction (identify common complaint/praise topics)
  - Review trend alerts when sentiment shifts
  - AI reply suggestions for reviews

- [ ] **Enhanced Inbox AI Drafting**
  - Intent detection (classify as Refund Request, Shipping Inquiry, Product Question)
  - Sentiment detection to prioritize upset customers
  - Suggested actions (e.g., "Customer asking about order #123 - show details")
  - Keep human-in-the-loop: AI drafts, human sends

---

### Customer Intelligence

- [ ] **RFM Segmentation** — Recency, Frequency, Monetary scoring (industry standard)
- [ ] **Behavioral Segments** — Cart abandoners, Browse-no-purchase, One-time vs Repeat
- [ ] **Predictive Churn Scoring** — Identify at-risk customers before they leave
- [ ] **Customer Health Score** — Composite metric from engagement, purchase frequency, support
- [ ] **VIP Detection** — Auto-flag high-value customers for priority treatment

---

### Marketing

- [ ] **SMS Marketing Campaigns** — Marketing SMS alongside email broadcasts
  - SMS automation triggers (abandoned cart, post-purchase)
  - Two-way SMS conversations in inbox
  - Subscriber opt-in/opt-out compliance
  
- [ ] **Email A/B Testing** — Subject line and content testing
- [ ] **Send Time Optimization** — AI-powered optimal send time per recipient
- [ ] **Dynamic Email Content** — Personalized product recommendations in emails

---

### PWA App

- [ ] In the meta data on the desktop version and pwa we need it to be the correct letter casing, if Woocommerce shows lowercase, we need lowercase and if uppercase we need uppercase.

---

### Quick Wins

- [ ] Email open/click tracking visualization
- [ ] Bulk order status update
- [ ] Order timeline (events log)
- [ ] Export customer segments to CSV
