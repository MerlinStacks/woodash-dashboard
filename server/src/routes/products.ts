/**
 * Products Route - Fastify Plugin
 */

import { FastifyPluginAsync } from 'fastify';
import { ProductsService } from '../services/products';
import { requireAuthFastify } from '../middleware/auth';
import { WooService } from '../services/woo';
import { prisma } from '../utils/prisma';
import { Logger } from '../utils/logger';
import { SeoScoringService } from '../services/SeoScoringService';
import { MerchantCenterService } from '../services/MerchantCenterService';
import { IndexingService } from '../services/search/IndexingService';
import { esClient } from '../utils/elastic';
import { marked } from 'marked';

const productsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', requireAuthFastify);

    // GET / - Search products
    fastify.get('/', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const query = request.query as { page?: string; limit?: string; q?: string };
            const page = parseInt(query.page || '1');
            const limit = parseInt(query.limit || '20');
            const q = query.q || '';

            const result = await ProductsService.searchProducts(accountId, q, page, limit);
            return result;
        } catch (error: any) {
            Logger.error('Error', { error });
            return reply.code(500).send({ error: 'Failed to fetch products' });
        }
    });

    // GET /:id - Get single product
    fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const wooId = parseInt(request.params.id);
            if (isNaN(wooId)) return reply.code(400).send({ error: 'Invalid product ID' });

            const product = await ProductsService.getProductByWooId(accountId, wooId);
            if (!product) return reply.code(404).send({ error: 'Product not found' });

            return product;
        } catch (error: any) {
            Logger.error('Error', { error });
            return reply.code(500).send({ error: 'Failed to fetch product' });
        }
    });

    // POST /:id/sync - Force sync from Woo
    fastify.post<{ Params: { id: string } }>('/:id/sync', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const wooId = parseInt(request.params.id);
            if (isNaN(wooId)) return reply.code(400).send({ error: 'Invalid product ID' });

            const woo = await WooService.forAccount(accountId);
            const p = await woo.getProduct(wooId);

            if (!p) return reply.code(404).send({ error: 'Product not found in WooCommerce' });

            await prisma.wooProduct.upsert({
                where: { accountId_wooId: { accountId, wooId: p.id } },
                update: {
                    name: p.name,
                    price: p.price === '' ? null : p.price,
                    stockStatus: p.stock_status,
                    rawData: p as any,
                    mainImage: p.images?.[0]?.src,
                    weight: p.weight ? parseFloat(p.weight) : null,
                    length: p.dimensions?.length ? parseFloat(p.dimensions.length) : null,
                    width: p.dimensions?.width ? parseFloat(p.dimensions.width) : null,
                    height: p.dimensions?.height ? parseFloat(p.dimensions.height) : null,
                    images: p.images || []
                },
                create: {
                    accountId,
                    wooId: p.id,
                    name: p.name,
                    sku: p.sku,
                    price: p.price === '' ? null : p.price,
                    stockStatus: p.stock_status,
                    permalink: p.permalink,
                    mainImage: p.images?.[0]?.src,
                    weight: p.weight ? parseFloat(p.weight) : null,
                    length: p.dimensions?.length ? parseFloat(p.dimensions.length) : null,
                    width: p.dimensions?.width ? parseFloat(p.dimensions.width) : null,
                    height: p.dimensions?.height ? parseFloat(p.dimensions.height) : null,
                    images: p.images || [],
                    rawData: p as any
                }
            });

            const upsertedProduct = await prisma.wooProduct.findUnique({
                where: { accountId_wooId: { accountId, wooId: p.id } }
            });

            if (upsertedProduct) {
                const currentSeoData = (upsertedProduct.seoData as any) || {};
                const focusKeyword = currentSeoData.focusKeyword || '';

                const seoResult = SeoScoringService.calculateScore(upsertedProduct, focusKeyword);
                const mcResult = MerchantCenterService.validateCompliance(upsertedProduct);

                await prisma.wooProduct.update({
                    where: { id: upsertedProduct.id },
                    data: {
                        seoScore: seoResult.score,
                        seoData: { ...currentSeoData, analysis: seoResult.tests },
                        merchantCenterScore: mcResult.score,
                        merchantCenterIssues: mcResult.issues as any
                    }
                });

                try {
                    await IndexingService.indexProduct(accountId, {
                        ...p,
                        seoScore: seoResult.score,
                        merchantCenterScore: mcResult.score
                    });
                } catch (err) {
                    Logger.warn("Failed to index product during manual sync", { error: err });
                }
            }

            const finalProduct = await ProductsService.getProductByWooId(accountId, wooId);
            return finalProduct;

        } catch (error: any) {
            Logger.error("Force Sync Error", { error });
            return reply.code(500).send({ error: 'Failed to sync product: ' + error.message });
        }
    });

    // PATCH /:id - Update product
    fastify.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const wooId = parseInt(request.params.id);
            if (isNaN(wooId)) return reply.code(400).send({ error: 'Invalid product ID' });

            const { binLocation, name, stockStatus, isGoldPriceApplied, sku, price, salePrice, weight, length, width, height, description, short_description, cogs, supplierId, images } = request.body as any;

            const product = await ProductsService.updateProduct(accountId, wooId, {
                binLocation, name, stockStatus, isGoldPriceApplied,
                sku, price, salePrice, weight, length, width, height, description, short_description,
                cogs, supplierId, images
            });
            return product;
        } catch (error: any) {
            Logger.error('Error', { error });
            return reply.code(500).send({ error: 'Failed to update product' });
        }
    });

    // GET /:id/sales-history - Get sales history from Elasticsearch
    fastify.get<{ Params: { id: string } }>('/:id/sales-history', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const wooId = parseInt(request.params.id);
            if (isNaN(wooId)) return reply.code(400).send({ error: 'Invalid product ID' });

            const query = request.query as { page?: string; limit?: string };
            const page = parseInt(query.page || '1');
            const limit = parseInt(query.limit || '20');
            const from = (page - 1) * limit;

            const response = await esClient.search({
                index: 'orders',
                size: limit,
                from,
                body: {
                    query: {
                        bool: {
                            must: [
                                { term: { accountId } },
                                {
                                    nested: {
                                        path: 'line_items',
                                        query: { term: { 'line_items.productId': wooId } },
                                        inner_hits: { name: 'matched_items', size: 10 }
                                    }
                                }
                            ],
                            filter: [
                                { terms: { status: ['completed', 'processing', 'on-hold', 'pending'] } }
                            ]
                        }
                    },
                    sort: [{ date_created: { order: 'desc' } }]
                }
            });

            const hits = response.hits.hits;
            const total = typeof response.hits.total === 'number'
                ? response.hits.total
                : response.hits.total?.value || 0;

            const sales = hits.map((hit: any) => {
                const order = hit._source;
                const matchedItems = hit.inner_hits?.matched_items?.hits?.hits || [];
                let quantity = 0;
                let lineTotal = 0;

                matchedItems.forEach((itemHit: any) => {
                    const item = itemHit._source;
                    quantity += item.quantity || 0;
                    lineTotal += parseFloat(item.total) || 0;
                });

                return {
                    orderId: order.id,
                    orderNumber: order.number || `#${order.id}`,
                    date: order.date_created,
                    status: order.status,
                    customerName: order.billing
                        ? `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim() || order.billing.email
                        : 'Guest',
                    customerEmail: order.billing?.email,
                    quantity,
                    lineTotal,
                    currency: order.currency || 'USD'
                };
            });

            return {
                sales,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };

        } catch (error: any) {
            Logger.error('Error fetching product sales history', { error });
            return reply.code(500).send({ error: 'Failed to fetch sales history' });
        }
    });

    // POST /:id/rewrite-description - AI rewrite
    fastify.post<{ Params: { id: string } }>('/:id/rewrite-description', async (request, reply) => {
        try {
            const accountId = request.accountId!;
            const wooId = parseInt(request.params.id);
            if (isNaN(wooId)) return reply.code(400).send({ error: 'Invalid product ID' });

            const { currentDescription, productName, categories, shortDescription } = request.body as any;

            const account = await prisma.account.findUnique({
                where: { id: accountId },
                select: { openRouterApiKey: true, aiModel: true }
            });

            if (!account?.openRouterApiKey) {
                return reply.code(400).send({
                    error: 'No OpenRouter API key configured. Please add your API key in Settings > AI.'
                });
            }

            const promptConfig = await prisma.aIPrompt.findUnique({
                where: { promptId: 'product_description' }
            });

            if (!promptConfig?.content) {
                return reply.code(400).send({
                    error: 'Product description AI prompt not configured. Contact your administrator.'
                });
            }

            let prompt = promptConfig.content
                .replace(/\{\{product_name\}\}/g, productName || '')
                .replace(/\{\{current_description\}\}/g, currentDescription || '')
                .replace(/\{\{short_description\}\}/g, shortDescription || '')
                .replace(/\{\{category\}\}/g, categories || '');

            const model = account.aiModel || 'openai/gpt-4o';

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${account.openRouterApiKey}`,
                    'HTTP-Referer': 'https://overseek.app',
                    'X-Title': 'OverSeek Product Rewrite',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 2000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                Logger.error('OpenRouter API error during rewrite', { error: errorText, status: response.status });

                let errorMessage = 'Failed to generate description.';
                if (response.status === 401) {
                    errorMessage = 'Invalid OpenRouter API key. Please check your credentials in Settings > Intelligence.';
                } else if (response.status === 429) {
                    errorMessage = 'Rate limit exceeded. Please try again in a moment.';
                } else if (response.status === 402) {
                    errorMessage = 'Insufficient credits on OpenRouter. Please top up your account.';
                } else {
                    errorMessage = `OpenRouter API error (${response.status}). Please try again.`;
                }

                return reply.code(502).send({ error: errorMessage });
            }

            const data = await response.json();
            const generatedDescription = data.choices?.[0]?.message?.content || '';

            if (!generatedDescription) {
                return reply.code(500).send({ error: 'AI returned empty response' });
            }

            const formattedDescription = marked.parse(generatedDescription.trim()) as string;

            return { description: formattedDescription };

        } catch (error: any) {
            Logger.error('Error rewriting product description', { error });
            return reply.code(500).send({ error: 'Failed to rewrite description' });
        }
    });
};

export default productsRoutes;
