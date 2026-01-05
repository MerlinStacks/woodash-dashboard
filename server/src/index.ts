import dotenv from 'dotenv';
dotenv.config();

import { server } from './app';
import { SchedulerService } from './services/SchedulerService';
import { startWorkers } from './workers';
import { QueueFactory } from './services/queue/QueueFactory';

const port = process.env.PORT || 3000;

// Global Error Handlers to prevent silent crashes
process.on('uncaughtException', (error) => {
  console.error('[CRITICAL] Uncaught Exception:', error);
  // Optional: process.exit(1); // Keep alive for dev debugging, or exit cleanly
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Internal Workers (if running in same process)
try {
  startWorkers();
  console.log('[Startup] Workers initialized (Force Update)');
} catch (error) {
  console.error('[Startup] Failed to start workers:', error);
  // Continue - workers will be retried by BullMQ
}

// QueueFactory already inited in app.ts, but safe to access queues here if needed.

// Start Scheduler (async - must handle errors)
SchedulerService.start().catch((error: any) => {
  console.error('[Startup] Failed to start scheduler:', error);
  // Continue - scheduler is not critical for initial startup
});

server.listen(port, () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
