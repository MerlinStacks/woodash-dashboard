import { OrderTools } from './tools/OrderTools';
import { InventoryTools } from './tools/InventoryTools';
import { SalesTools } from './tools/SalesTools';
import { ProductTools } from './tools/ProductTools';
import { CustomerTools } from './tools/CustomerTools';

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
                description: "Get a summary of inventory, including low stock items.",
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
                description: "Get sales analytics for a specific period.",
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
                return OrderTools.getRecentOrders(accountId, args.limit, args.status);
            case 'get_inventory_summary':
                return InventoryTools.getInventorySummary(accountId, args.limit);
            case 'get_sales_analytics':
                return SalesTools.getSalesAnalytics(accountId, args.period);
            case 'search_products':
                return ProductTools.searchProducts(accountId, args.query);
            case 'find_customer':
                return CustomerTools.findCustomer(accountId, args.query);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
}
