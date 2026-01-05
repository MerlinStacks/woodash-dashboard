import { WooProduct } from '@prisma/client';

export interface MerchantCenterIssue {
    severity: 'error' | 'warning'; // map to red/yellow
    message: string;
    attribute?: string;
}

export interface MerchantCenterResult {
    score: number;
    issues: MerchantCenterIssue[];
}

export class MerchantCenterService {

    static validateCompliance(product: Partial<WooProduct>): MerchantCenterResult {
        const issues: MerchantCenterIssue[] = [];
        let score = 100;

        const raw = (product.rawData as any) || {};

        // 1. ID / SKU
        if (!product.sku && !product.wooId) {
            issues.push({ severity: 'error', message: 'Product is missing a unique identifier (SKU or ID).', attribute: 'id' });
            score -= 20;
        }

        // 2. Title
        if (!product.name) {
            issues.push({ severity: 'error', message: 'Title is required.', attribute: 'title' });
            score -= 20;
        } else if (product.name.length > 150) {
            issues.push({ severity: 'warning', message: 'Title is too long (> 150 chars).', attribute: 'title' });
            score -= 5;
        }

        // 3. Description
        const description = raw.description || raw.short_description || '';
        if (!description) {
            issues.push({ severity: 'error', message: 'Description is required.', attribute: 'description' });
            score -= 15;
        }

        // 4. Image Link
        const images = raw.images || [];
        if (!images.length || !images[0].src) {
            issues.push({ severity: 'error', message: 'Main image is required.', attribute: 'image_link' });
            score -= 20;
        }

        // 5. Price
        if (!product.price) {
            issues.push({ severity: 'error', message: 'Price is required.', attribute: 'price' });
            score -= 10;
        }

        // 6. GTIN / MPN (Identifier Exists)
        // Woo doesn't have standard GTIN fields by default, usually plugins add them.
        // We'll check for common meta keys or attributes if possible, or just warn.
        // For now, we'll check if 'sku' acts as MPN and warn if strictly no GTIN-like data found in meta_data
        const meta = raw.meta_data || [];
        const hasGtin = meta.some((m: any) => m.key && (m.key.includes('gtin') || m.key.includes('barcode') || m.key.includes('ean')));

        if (!hasGtin) {
            // Not a hard error if "identifier_exists" is set to no, but generally we want it.
            issues.push({ severity: 'warning', message: 'GTIN/Barcode not found. Strongly recommended for performance.', attribute: 'gtin' });
            score -= 10;
        }

        // 7. Availability
        if (!product.stockStatus) {
            issues.push({ severity: 'error', message: 'Availability (stock status) is unknown.', attribute: 'availability' });
            score -= 10;
        }

        return {
            score: Math.max(0, score),
            issues
        };
    }
}
