import { PrismaClient, PurchaseOrder, PurchaseOrderItem } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { WooService } from './woo';
import { Logger } from '../utils/logger';

export class PurchaseOrderService {

    /**
     * List Purchase Orders for an account with optional status filtering
     */
    async listPurchaseOrders(accountId: string, status?: string) {
        return prisma.purchaseOrder.findMany({
            where: {
                accountId,
                ...(status ? { status } : {})
            },
            include: {
                supplier: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get a single Purchase Order by ID
     */
    async getPurchaseOrder(accountId: string, poId: string) {
        return prisma.purchaseOrder.findFirst({
            where: { id: poId, accountId },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true,
                        supplierItem: true
                    }
                }
            }
        });
    }

    /**
     * Create a new Purchase Order
     */
    async createPurchaseOrder(accountId: string, data: {
        supplierId: string;
        items: {
            productId?: string;
            supplierItemId?: string;
            quantity: number;
            unitCost: number;
            name: string;
            sku?: string;
        }[];
        notes?: string;
        expectedDate?: string; // ISO Date string
    }) {
        // Calculate totals
        let totalAmount = 0;
        const itemsToCreate = data.items.map(item => {
            const lineTotal = item.quantity * item.unitCost;
            totalAmount += lineTotal;
            return {
                productId: item.productId,
                supplierItemId: item.supplierItemId,
                quantity: item.quantity,
                unitCost: item.unitCost, // Decimal handling? Prisma handles primitive numbers to Decimal often, but better to be safe
                totalCost: lineTotal,
                name: item.name,
                sku: item.sku
            };
        });

        return prisma.purchaseOrder.create({
            data: {
                accountId,
                supplierId: data.supplierId,
                status: 'DRAFT',
                notes: data.notes,
                expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
                totalAmount,
                items: {
                    create: itemsToCreate
                }
            }
        });
    }

    /**
     * Update a Purchase Order (Status or Fields)
     */
    async updatePurchaseOrder(accountId: string, poId: string, data: {
        status?: string;
        notes?: string;
        expectedDate?: string;
    }) {
        return prisma.purchaseOrder.updateMany({ // Use updateMany for security (accountId check)
            where: { id: poId, accountId },
            data: {
                ...(data.status ? { status: data.status } : {}),
                ...(data.notes !== undefined ? { notes: data.notes } : {}),
                ...(data.expectedDate ? { expectedDate: new Date(data.expectedDate) } : {})
            }
        });
    }

    /**
     * Calculate Inbound Inventory Quantity for a specific Product
     * Sums quantity from POs with status 'ORDERED'
     */
    async getInboundInventory(accountId: string, productId: string): Promise<number> {
        const aggregations = await prisma.purchaseOrderItem.aggregate({
            where: {
                productId,
                purchaseOrder: {
                    accountId,
                    status: 'ORDERED'
                }
            },
            _sum: {
                quantity: true
            }
        });

        return aggregations._sum.quantity || 0;
    }

    /**
     * Receive stock from a Purchase Order.
     * Increments stockQuantity on linked products/variants and syncs to WooCommerce.
     */
    async receiveStock(accountId: string, poId: string): Promise<{ updated: number; errors: string[] }> {
        const po = await prisma.purchaseOrder.findFirst({
            where: { id: poId, accountId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                boms: {
                                    select: {
                                        id: true,
                                        items: {
                                            where: { childProductId: { not: null } },
                                            select: { id: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!po) {
            throw new Error('Purchase Order not found');
        }

        const errors: string[] = [];
        let updated = 0;

        // Get WooService for syncing
        let wooService: WooService | null = null;
        try {
            wooService = await WooService.forAccount(accountId);
        } catch (err) {
            Logger.warn('Unable to connect to WooCommerce for stock sync', { error: err, accountId });
        }

        for (const item of po.items) {
            if (!item.productId || !item.product) {
                continue; // Skip items without linked product
            }

            // Skip BOM products - their stock is derived from components
            const hasBOM = item.product.boms?.some(bom => bom.items.length > 0) ?? false;
            if (hasBOM) {
                Logger.warn('Skipped stock update for BOM product', { productId: item.product.id, productName: item.product.name });
                errors.push(`${item.product.name} is a BOM product - stock not updated`);
                continue;
            }

            try {
                const product = item.product;
                const currentStock = product.stockQuantity ?? 0;
                const newStock = currentStock + item.quantity;

                // Update local stock
                await prisma.wooProduct.update({
                    where: { id: product.id },
                    data: {
                        stockQuantity: newStock,
                        manageStock: true,
                        stockStatus: newStock > 0 ? 'instock' : 'outofstock'
                    }
                });

                Logger.info('Stock received for product', {
                    productId: product.id,
                    wooId: product.wooId,
                    previousStock: currentStock,
                    addedQuantity: item.quantity,
                    newStock
                });

                // Sync to WooCommerce (non-blocking)
                if (wooService) {
                    try {
                        await wooService.updateProduct(product.wooId, {
                            manage_stock: true,
                            stock_quantity: newStock
                        });
                    } catch (wooErr) {
                        Logger.warn('Failed to sync received stock to WooCommerce', {
                            error: wooErr,
                            productWooId: product.wooId
                        });
                        errors.push(`WooCommerce sync failed for ${product.name}: ${(wooErr as Error).message}`);
                    }
                }

                updated++;
            } catch (err) {
                const errorMsg = `Failed to update stock for item "${item.name}": ${(err as Error).message}`;
                Logger.error('Error receiving stock for PO item', { error: err, itemId: item.id });
                errors.push(errorMsg);
            }
        }

        return { updated, errors };
    }
}
