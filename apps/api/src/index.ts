import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({
    logger: true
});

fastify.register(cors, {
    origin: '*' // Configure safely later
});

import cookie from '@fastify/cookie';
import { authRoutes } from './routes/auth';

// Register Plugins
fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'super-secret-key-change-me-in-prod-please',
    parseOptions: {}
});

// Routes
import { authRoutes } from './routes/auth';
import { syncRoutes } from './routes/sync';
import { settingsRoutes } from './routes/settings';
import { analyticsRoutes } from './routes/analytics';
import { adminRoutes } from './routes/admin'; // Legacy/General Admin
import { proxyRoutes } from './routes/proxy';

// Register Routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(syncRoutes, { prefix: '/api/sync' });
fastify.register(settingsRoutes, { prefix: '/api/settings' });
fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
import { complianceRoutes } from './routes/compliance';
fastify.register(complianceRoutes, { prefix: '/api/compliance' });
import { marketingRoutes } from './routes/marketing';
fastify.register(marketingRoutes, { prefix: '/api/marketing' });
fastify.register(adminRoutes, { prefix: '/api/admin' });
fastify.register(proxyRoutes, { prefix: '/api/proxy' });


fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date() }
});

const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '4000');
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
start();
