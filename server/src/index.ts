import dotenv from 'dotenv';
dotenv.config();

import { appPromise, app } from './app';
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

// Main startup function
async function start() {
  // Wait for Fastify app to be fully initialized
  await appPromise;

  // Start Internal Workers
  try {
    await startWorkers();
    Logger.info('[Startup] Workers initialized');
  } catch (error) {
    Logger.error('[Startup] Failed to start workers', { error });
  }

  // Start Scheduler
  try {
    await SchedulerService.start();
    Logger.info('[Startup] Scheduler started');
  } catch (error) {
    Logger.error('[Startup] Failed to start scheduler', { error });
  }

  // Initialize Elastic Indices
  try {
    await IndexingService.initializeIndices();
    Logger.info('[Startup] Elasticsearch indices initialized');
  } catch (error) {
    Logger.error('[Startup] Failed to initialize Elasticsearch indices', { error });
  }

  // Start Fastify server
  try {
    await app.listen({ port: Number(port), host: '0.0.0.0' });
    Logger.info(`[Server] Fastify listening on http://0.0.0.0:${port}`);

    // Initialize graceful shutdown after server starts
    initGracefulShutdown(app.server);
  } catch (error) {
    Logger.error('[CRITICAL] Failed to start server', { error });
    process.exit(1);
  }
}

start();
