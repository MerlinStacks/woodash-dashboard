/**
 * Prisma Client with PostgreSQL Driver Adapter
 * 
 * Prisma ORM v7 requires explicit driver adapters. This module
 * configures the PostgreSQL adapter for database connections.
 * 
 * @module utils/prisma
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore - Prisma 7 driver adapter types
import { PrismaClient } from '@prisma/client';

// Re-export types from @prisma/client for consumers
export * from '@prisma/client';

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Export configured Prisma client singleton
// @ts-ignore - Prisma 7 adapter typing known issue
export const prisma = new PrismaClient({ adapter });

/**
 * Create a new PrismaClient instance with driver adapter.
 * Use this for scripts that need their own client instance.
 */
export function createPrismaClient(): PrismaClient {
    const scriptPool = new Pool({ connectionString: process.env.DATABASE_URL });
    const scriptAdapter = new PrismaPg(scriptPool);
    // @ts-ignore - Prisma 7 adapter typing known issue
    return new PrismaClient({ adapter: scriptAdapter });
}
