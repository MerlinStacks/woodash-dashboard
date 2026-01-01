import { FastifyInstance } from 'fastify';
import axios from 'axios';
import https from 'https';

export async function proxyRoutes(fastify: FastifyInstance) {
    fastify.all('/*', async (req: any, reply) => {
        const storeUrl = req.headers['x-store-url'];

        if (!storeUrl) {
            return reply.status(400).send({ error: 'Missing x-store-url header' });
        }

        // Strip /api/proxy prefix to get the path
        const path = req.url.replace('/api/proxy', '');

        // Ensure path starts with / if not empty (it returns empty if matches exactly, effectively root)
        // If path is empty string, it means we hit root logic? usually valid.

        let finalUrl = '';

        // Handle WP V2 namespace
        if (path.startsWith('/wp/v2')) {
            finalUrl = `${storeUrl}/wp-json${path}`;
        } else if (path.startsWith('/overseek/v1')) {
            finalUrl = `${storeUrl}/wp-json${path}`;
        } else {
            // Default to WC V3
            finalUrl = `${storeUrl}/wp-json/wc/v3${path}`;
        }

        // Config
        const config: any = {
            method: req.method,
            url: finalUrl,
            headers: {
                'Authorization': req.headers['authorization'] as string,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params: req.query,
            data: req.body,
            httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Allow self-signed
        };

        try {
            const response = await axios(config);
            reply.status(response.status).headers(response.headers as any).send(response.data);
        } catch (err: any) {
            if (err.response) {
                reply.status(err.response.status).send(err.response.data);
            } else {
                reply.status(500).send({ error: err.message });
            }
        }
    });
}
