import dotenv from 'dotenv';
dotenv.config();

import { server } from './app';
import { SchedulerService } from './services/SchedulerService';
import { startWorkers } from './workers';
import { QueueFactory } from './services/queue/QueueFactory';
import { IndexingService } from './services/search/IndexingService';
import { Logger } from './utils/logger';

const port = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  Logger.error('[SECURITY] JWT_SECRET is not defined. Server will crash on auth module load.');
}

// Global Error Handlers to prevent silent crashes
process.on('uncaughtException', (error) => {
  Logger.error('[CRITICAL] Uncaught Exception', { error });
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('[CRITICAL] Unhandled Rejection', { reason, promise: String(promise) });
});

// Start Internal Workers (if running in same process)
startWorkers().then(() => {
  Logger.info('[Startup] Workers initialized');
}).catch((error) => {
  Logger.error('[Startup] Failed to start workers', { error });
});

// QueueFactory already inited in app.ts, but safe to access queues here if needed.

// Start Scheduler (async - must handle errors)
SchedulerService.start().catch((error: any) => {
  Logger.error('[Startup] Failed to start scheduler', { error });
});

// Initialize Elastic Indices
IndexingService.initializeIndices().catch((error) => {
  Logger.error('[Startup] Failed to initialize Elasticsearch indices', { error });
});

server.listen(port, () => {
  Logger.info(`[Server] Listening on http://0.0.0.0:${port}`);
});
