# Future Work & Roadmap

This document tracks planned enhancements, known bugs, and future feature ideas for the OverSeek platform.

## Inbox Enhancements (Jan 2026)

### Completed ✅
- [x] Channel Routing - Replies route to selected channel (Email/Facebook/Instagram/TikTok)
- [x] Notification Filtering - Only notify assigned agent, not all agents
- [x] Email Threading - In-Reply-To/References headers for proper thread display
- [x] Conversation Search - Global search across all conversations with debounced API
- [x] Keyboard Shortcuts - J/K navigate, E close, O open, R reply, / search, ? help
- [x] Message Scheduling - Schedule emails/messages for later delivery (`scheduledFor` field + worker)
- [x] Labels/Tags - Categorize conversations (ConversationLabel, LabelSelector, filter by label)
- [x] Bulk Actions - Bulk close, assign, or tag conversations (BulkActionToolbar)
- [x] Snooze Reminders - Notification when snoozed conversations re-open (socket events)

### Remaining 🚧

#### Medium Priority
- [x] **Canned Responses Enhancements** - Improve existing canned responses ✅
  - Added placeholders like `{{customer.firstName}}`, `{{customer.email}}`
  - Categories/folders for organizing responses
  - Search/filter in dropdown
  - Settings page for management

- [x] **Read Receipts** - Track when customers open emails ✅
  - Tracking pixel route `GET /api/email/track/:id.png`
  - Log opens to `EmailLog` table
  - Show "Opened" status in MessageBubble

#### Lower Priority
- [x] **Customer Timeline** - Show order history in contact panel ✅ (Already implemented)
  - ContactPanel shows recent orders from WooOrder
  - Shows previous conversations count
  - Displays customer lifetime value (totalSpent)

---

## Infrastructure Improvements (Jan 2026) ✅

- [x] Secrets moved from docker-compose to environment variables
- [x] SyncLog and AnalyticsVisit retention policies (JanitorService)
- [x] BullMQ TTL-based job expiration (24h for failed jobs)
- [x] Socket.IO Redis adapter for horizontal scaling
- [x] React.lazy code splitting (40+ pages)
- [x] SCAN-based cache invalidation (replaces blocking KEYS)
- [x] Automation overflow detection (backlog > 100 warning)
- [x] Elasticsearch heap increased (512MB → 1GB)
- [x] Vitest test infrastructure configured

---

## Next Up 🚧

#### Productivity
- [x] **Collision Detection** — Show "Agent X is viewing" to prevent duplicate responses ✅
  - Socket.IO events for presence tracking
  - UI indicator in ChatHeader header

- [x] **Conversation Notes** — Sticky notes visible to all agents ✅
  - New `ConversationNote` model
  - Notes panel in ContactPanel
  - Real-time sync via Socket.IO

#### User Experience  
- [x] **Desktop Notifications** — Native browser push when new messages arrive ✅ (Already implemented)
  - `usePushNotifications.ts` hook with VAPID/ServiceWorker
  - `NotificationSettings.tsx` with toggle + preferences
  - Test notification button

#### Big Projects
- [ ] **Mobile App** — React Native companion app
  - Push notifications
  - Core inbox functionality
  - Read-only initially, messaging later

- [ ] **Marketplace Sync** — Amazon/eBay inventory sync
  - Two-way stock sync
  - Order import from marketplaces
  - Unified product catalog

---

## Platform-Wide Features 🚧

#### Orders
- [x] **Fraud Detection** — AI score on suspicious orders ✅
  - Shipping/billing mismatch, velocity, geolocation
  - FraudBadge in OrderDetailPage header
  - API endpoint: `GET /orders/:id/fraud-score`

#### Customers
- [x] **Customer Merge** — Combine duplicate customer records ✅
  - Match by email/phone
  - Merge orders, conversations, enrollments
  - MergeCustomerModal in CustomerDetailsPage

#### Reviews
- [ ] **Review Response Templates** — Quick reply to reviews
  - Canned responses for reviews
  - One-click positive/negative templates
  - Auto-thank for 5-star reviews

---

## Recently Completed ✅

- **Inbox Macros/Automations** — Quick 1-click actions + inbox triggers
  - MESSAGE_RECEIVED, TAG_ADDED, CONVERSATION_CLOSED triggers
  - ASSIGN, ADD_TAG, CLOSE, SEND_CANNED actions
  - MacrosDropdown in ChatHeader

