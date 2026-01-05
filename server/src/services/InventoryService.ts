import { PrismaClient } from '@prisma/client';
import { WooService } from './woo';
import { EventBus, EVENTS } from './events';
import { Logger } from '../utils/logger';

const prisma = new PrismaClient();

export class InventoryService {
    static async setupListeners() {
        // Listen for new orders to deduct stock
        EventBus.on(EVENTS.ORDER.CREATED, async (data) => {
            const { accountId, order } = data;
            Logger.info(`[InventoryService] Processing Order ${order.number} for BOM deduction`, { accountId });
            await InventoryService.processOrderBOM(accountId, order);
        });
    }

    /**
     * Process an order to deduct stock for BOM child items.
     * When a parent product is sold, its child components' stock is reduced.
     */
    static async processOrderBOM(accountId: string, order: any) {
        try {
            const wooService = await WooService.forAccount(accountId);

            for (const lineItem of order.line_items) {
                const productId = lineItem.product_id; // WooCommerce ID
                const quantitySold = lineItem.quantity;

                // Find local product to get BOM
                const product = await prisma.wooProduct.findUnique({
                    where: { accountId_wooId: { accountId, wooId: productId } },
                    include: {
                        bom: {
                            include: {
                                items: {
                                    include: {
                                        childProduct: true
                                    }
                                }
                            }
                        }
                    }
                });

                if (!product || !product.bom || product.bom.items.length === 0) {
                    continue; // No BOM, standard product
                }

                Logger.info(`[InventoryService] Found BOM for Product ${productId} in Order ${order.number}. Processing components...`, { accountId });

                // Deduct stock for each child component
                for (const bomItem of product.bom.items) {
                    if (bomItem.childProductId && bomItem.childProduct) {
                        const childWooId = bomItem.childProduct.wooId;
                        const qtyPerUnit = Number(bomItem.quantity); // Logic check: Is this raw quantity or per unit? Assuming per unit.
                        // Optional: Add Waste Factor? usually waste is for manufacturing, verified sales just use raw BOM qty.
                        // Let's stick to raw quantity for now.

                        const deductionQty = qtyPerUnit * quantitySold;

                        // Fetch current stock of child to calculate new stock?
                        // Woo API allows updating "stock_quantity". We need to know current.
                        // Or we can rely on our local synced data if valid.
                        // Safer to fetch fresh data or just blindly subtract if we trust our sync?
                        // Woo API v3 doesn't support "decrement", so we must read-modify-write.

                        // We'll read from our local DB first for speed, but ideally verify.
                        // Relying on local data for now as we just synced? No, sync might be slightly behind if high velocity.
                        // Let's fetch fresh from Woo to be safe.

                        try {
                            const childParams = {
                                stock_quantity: -1 // Will handle logic below
                            };

                            // Fetch raw from Woo
                            // WooService doesn't expose getProduct(id) single yet directly publicly in the plan, let's assume getProducts filtering works or add it.
                            // Actually WooService wraps "get" generic.

                            // Implementation detail: We need getProduct.
                            // Let's just update `WooService` to expose getting a single product or use the internal api access if possible.
                            // Wait, `WooService` in this project is a wrapper. I should probably add `getProduct` or strictly use `updateProduct`.

                            // Better approach:
                            // If we want to be atomic, we can't easily be atomic with Woo REST API.
                            // We will try to get current stock from local DB, subtract, and push.
                            // If local DB is stale, we might have issues.
                            // But usually `order.created` happens right after sync.

                            const currentStock = bomItem.childProduct.stockStatus === 'instock' ? 100 : 0; // Placeholder if we don't track exact stock in DB?
                            // Schema doesn't have `stockQuantity` on WooProduct??
                            // Let's check schema...
                            // WooProduct has `stockStatus`. It does NOT have `stockQuantity`.
                            // This is a missing feature in our schema if we want to manage inventory!
                            // Investigating this in next steps. For now, assuming we can't deduct without knowing stock.

                            // Wait, user wants "reduce stock".
                            // If we don't store stock level locally, we MUST fetch it from Woo first.

                            // We will implementation basic logic to fetch from Woo first.
                            const wooProductResponse = await wooService.getProduct(childWooId); // Need to add this method
                            const currentWooStock = wooProductResponse.stock_quantity;

                            if (typeof currentWooStock === 'number') {
                                const newStock = currentWooStock - deductionQty;
                                await wooService.updateProduct(childWooId, {
                                    stock_quantity: newStock,
                                    manage_stock: true // Ensure stock management is on
                                });
                                Logger.info(`[InventoryService] Deducted ${deductionQty} from Child Product ${childWooId}. New Stock: ${newStock}`, { accountId });
                            } else {
                                Logger.warn(`[InventoryService] Child Product ${childWooId} does not have managed stock. Skipping deduction.`, { accountId });
                            }

                        } catch (err: any) {
                            Logger.error(`[InventoryService] Failed to update stock for child ${childWooId}`, { error: err.message, accountId });
                        }
                    }
                }
            }
        } catch (error: any) {
            Logger.error(`[InventoryService] Error processing BOM for order ${order.id}`, { error: error.message, accountId });
        }
    }

    /**
     * Recursively calculate COGS for a product.
     * Returns 0 if no BOM.
     */
    static async calculateCompositeCOGS(accountId: string, productId: string): Promise<number> {
        // Prevent infinite recursion with a depth check or set?
        return 0; // To be implemented fully in separate step
    }
}
