/**
 * Prisma Configuration for Prisma ORM v7
 * 
 * Required for Prisma 7+ which uses a config file instead of .env auto-loading.
 * Database URL is now configured here instead of in schema.prisma.
 */

import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

// Load .env file manually (Prisma 7 doesn't auto-load .env)
config();

export default defineConfig({
    earlyAccess: true,

    schema: path.join(import.meta.dirname, 'schema.prisma'),

    migrate: {
        migrations: path.join(import.meta.dirname, 'migrations'),
    },
});
