import { prisma } from '../utils/prisma';
import { esClient } from '../utils/elastic';

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: any;
        required: string[];
    };
}

export class AIToolsService {

    static getDefinitions(): ToolDefinition[] {
        return [
            {
                name: "get_recent_orders",
                description: "Get recent orders for the store. Useful for answering questions about latest sales, order volume, or specific recent transactions.",
                parameters: {
                    type: "object",
                    properties: {
                        limit: { type: "integer", description: "Number of orders to retrieve (default 5, max 20)" },
                        status: { type: "string", description: "Filter by status (e.g., 'completed', 'processing', 'pending')" }
                    },
                    required: []
                }
            },
            {
                name: "get_inventory_summary",
                description: "Get a summary of inventory, including low stock items. Useful for 'how is my stock?' or 'what needs reordering?'.",
                parameters: {
                    type: "object",
                    properties: {
                        limit: { type: "integer", description: "Number of low stock items to list (default 5)" }
                    },
                    required: []
                }
            },
            {
                name: "get_sales_analytics",
                description: "Get sales analytics for a specific period. Useful for 'how much did we make today/yesterday/last week?'.",
                parameters: {
                    type: "object",
                    properties: {
                        period: { type: "string", description: "Time period: 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month'", enum: ["today", "yesterday", "last_7_days", "last_30_days", "this_month"] }
                    },
                    required: ["period"]
                }
            },
            {
                name: "search_products",
                description: "Search for specific products by name or keyword.",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Product name or keyword to search for" }
                    },
                    required: ["query"]
                }
            },
            {
                name: "find_customer",
                description: "Find a customer by name or email.",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Email address or name of the customer" }
                    },
                    required: ["query"]
                }
            }
        ];
    }

    static async executeTool(name: string, args: any, accountId: string): Promise<any> {
        console.log(`[AITools] Executing ${name} for account ${accountId}`, args);

        switch (name) {
            case 'get_recent_orders':
                return this.getRecentOrders(accountId, args.limit, args.status);
            case 'get_inventory_summary':
                return this.getInventorySummary(accountId, args.limit);
            case 'get_sales_analytics':
                return this.getSalesAnalytics(accountId, args.period);
            case 'search_products':
                return this.searchProducts(accountId, args.query);
            case 'find_customer':
                return this.findCustomer(accountId, args.query);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    private static async getRecentOrders(accountId: string, limit: number = 5, status?: string) {
        const query: any = {
            where: { accountId },
            take: Math.min(limit || 5, 20),
            orderBy: { dateCreated: 'desc' },
            select: {
                id: true,
                number: true,
                status: true,
                total: true,
                currency: true,
                dateCreated: true,
                billing: true // to show customer name if needed
            }
        };

        if (status) {
            query.where.status = status;
        }

        // Try Prisma first (Postgres), fallback to ES if needed? 
        // SyncService syncs to Prisma, so reliable source.
        try {
            const orders = await prisma.wooOrder.findMany(query);
            if (!orders.length) return "No orders found.";

            return orders.map((o: any) => ({
                id: o.number,
                status: o.status,
                total: `${o.currency} ${o.total}`,
                date: o.dateCreated?.toISOString().split('T')[0],
                customer: `${o.billing?.first_name} ${o.billing?.last_name}`
            }));
        } catch (error) {
            console.error("Tool Error (getRecentOrders):", error);
            return "Failed to retrieve orders.";
        }
    }

    private static async getInventorySummary(accountId: string, limit: number = 5) {
        try {
            // Finding 'outofstock' items as we don't track quantity natively in top-level schema yet
            const lowStockProducts = await prisma.wooProduct.findMany({
                where: {
                    accountId,
                    stockStatus: 'outofstock'
                },
                take: limit || 5,
                select: {
                    name: true,
                    stockStatus: true,
                    sku: true
                },
                orderBy: { name: 'asc' }
            });

            const totalProducts = await prisma.wooProduct.count({ where: { accountId } });

            return {
                total_products: totalProducts,
                low_stock_items: lowStockProducts.length > 0 ? lowStockProducts : "None (all well stocked)"
            };

        } catch (error) {
            console.error("Tool Error (getInventorySummary):", error);
            return "Failed to check inventory.";
        }
    }

    private static async getSalesAnalytics(accountId: string, period: string) {
        // Needs a bit of date logic
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'yesterday':
                startDate.setDate(startDate.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                // Handle range logic below if needed, for now just >= startDate logic 
                // Correction: Yesterday needs a specific range
                break;
            case 'last_7_days':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'last_30_days':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'this_month':
                startDate.setDate(1); // 1st of month
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        // "Yesterday" is the special case requiring an upper bound that isn't "now"
        const isYesterday = period === 'yesterday';
        const upperDate = isYesterday ? new Date(startDate.getTime() + 86400000) : now;

        try {
            const aggregations = await prisma.wooOrder.aggregate({
                where: {
                    accountId,
                    dateCreated: {
                        gte: startDate,
                        lt: upperDate
                    },
                    status: 'completed' // Only count completed sales? Or processing?
                },
                _sum: {
                    total: true
                },
                _count: {
                    id: true
                }
            });

            return {
                period,
                total_sales: aggregations._sum.total || 0,
                order_count: aggregations._count.id || 0,
                start_date: startDate.toISOString().split('T')[0]
            };

        } catch (error) {
            console.error("Tool Error (getSalesAnalytics):", error);
            return "Failed to calculate analytics.";
        }
    }

    private static async searchProducts(accountId: string, query: string) {
        try {
            // Using Prisma generic search for simplicity, later ES
            const products = await prisma.wooProduct.findMany({
                where: {
                    accountId,
                    name: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                take: 5,
                select: {
                    name: true,
                    price: true,
                    stockStatus: true,
                    permalink: true
                }
            });

            if (!products.length) return "No products found matching that name.";
            return products;

        } catch (error) {
            console.error("Tool Error (searchProducts):", error);
            return "Failed to search products.";
        }
    }

    private static async findCustomer(accountId: string, query: string) {
        try {
            const customers = await prisma.wooCustomer.findMany({
                where: {
                    accountId,
                    OR: [
                        { email: { contains: query, mode: 'insensitive' } },
                        { firstName: { contains: query, mode: 'insensitive' } },
                        { lastName: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 3,
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    totalSpent: true,
                    ordersCount: true
                }
            });

            if (!customers.length) return "No customer found.";
            return customers;

        } catch (error) {
            console.error("Tool Error (findCustomer):", error);
            return "Failed to find customer.";
        }
    }
}
