import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './dist/db/schema.js',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
