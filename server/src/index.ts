import dotenv from 'dotenv';
dotenv.config();

import { server } from './app';
import { SchedulerService } from './services/SchedulerService';
import { startWorkers } from './workers';
import { IndexingService } from './services/search/IndexingService';
import { Logger } from './utils/logger';
import { validateEnvironment } from './utils/env';
import { initGracefulShutdown } from './utils/shutdown';

// Validate environment variables before proceeding
try {
  validateEnvironment();
} catch (error) {
  Logger.error('[STARTUP] Environment validation failed, exiting');
  process.exit(1);
}

const port = process.env.PORT || 3000;

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

  // Initialize graceful shutdown after server starts
  initGracefulShutdown(server);
});
