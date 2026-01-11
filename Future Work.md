# Future Work & Roadmap

This document tracks planned enhancements, known bugs, and future feature ideas for the OverSeek platform.

## Inbox Enhancements (Jan 2026)

### Completed ✅
- [x] Channel Routing - Replies route to selected channel (Email/Facebook/Instagram/TikTok)
- [x] Notification Filtering - Only notify assigned agent, not all agents
- [x] Email Threading - In-Reply-To/References headers for proper thread display
- [x] Conversation Search - Global search across all conversations with debounced API
- [x] Keyboard Shortcuts - J/K navigate, E close, O open, R reply, / search, ? help

### Remaining 🚧

#### Medium Priority
- [ ] **Message Scheduling** - Schedule emails/messages for later delivery
  - Add `scheduledFor` field to Message model
  - Create ScheduledMessageWorker in SchedulerService
  - UI: Add schedule button/picker in ChatWindow
  
- [ ] **Email Templates** - Rich templates with placeholders like `{{customer.firstName}}`
  - New `EmailTemplate` Prisma model
  - Template manager UI (similar to CannedResponsesManager)
  - Placeholder replacement at send time

- [ ] **Read Receipts** - Track when customers open emails
  - Add tracking pixel route `GET /api/email/track/:id.png`
  - Log opens to `EmailLog` table
  - Show "Opened" status in MessageBubble

- [ ] **Snooze Reminders** - Notification when snoozed conversations re-open
  - SchedulerService: Check for due snoozed conversations
  - Emit socket event when snooze ends
  - Show toast notification to assigned agent

#### Lower Priority
- [ ] **Labels/Tags** - Categorize conversations (Billing, Shipping, Returns, etc.)
  - New `ConversationLabel` Prisma model
  - Label selector in ChatHeader
  - Filter by label in ConversationList

- [ ] **Bulk Actions** - Bulk close, assign, or tag conversations
  - Add checkbox selection in ConversationList
  - Bulk action toolbar (Close, Assign, Add Label)
  - Batch API endpoints

- [ ] **Customer Timeline** - Show order history in contact panel
  - Enhance ContactPanel with recent orders from WooOrder
  - Show previous conversations count
  - Display customer lifetime value
