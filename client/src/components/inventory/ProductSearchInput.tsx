/**
 * ProductSearchInput - Combobox for searching and selecting products
 * 
 * Fetches products via the existing search API and allows selection
 * with variant support for variable products.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { Search, Package, ChevronDown, X, Loader2 } from 'lucide-react';
import { Logger } from '../../utils/logger';

export interface ProductSelection {
    productId: string;        // Internal UUID
    wooId: number;            // WooCommerce ID
    variationWooId?: number;  // Variant WooId if selected
    name: string;
    sku?: string;
    price?: number;
    cogs?: number;
    image?: string;
}

interface ProductResult {
    id: string;
    woo_id?: number;
    name: string;
    sku?: string;
    price?: number;
    cogs?: number;
    stock_quantity?: number;
    stock_status?: string;
    images?: { src: string }[];
    main_image?: string;
    type?: string;
    variations?: VariationResult[];
    hasBOM?: boolean;  // Products with BOMs can't receive stock directly
}

interface VariationResult {
    wooId: number;
    sku?: string;
    price?: number;
    attributes?: { name: string; option: string }[];
    stock_quantity?: number;
}

interface ProductSearchInputProps {
    onSelect: (product: ProductSelection) => void;
    placeholder?: string;
    disabled?: boolean;
    initialValue?: string;
}

export function ProductSearchInput({
    onSelect,
    placeholder = 'Search products by name or SKU...',
    disabled = false,
    initialValue = ''
}: ProductSearchInputProps) {
    const { token } = useAuth();
    const { currentAccount } = useAccount();

    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<ProductResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
    const [showVariants, setShowVariants] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search
    const searchProducts = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || !token || !currentAccount) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Account-ID': currentAccount.id
                }
            });

            if (res.ok) {
                const data = await res.json();
                const products = data.products || data || [];
                // Filter out BOM products since they derive stock from components
                const nonBomProducts = products.filter((p: ProductResult) => !p.hasBOM);
                setResults(nonBomProducts);
            }
        } catch (error) {
            Logger.error('Product search failed', { error });
        } finally {
            setIsLoading(false);
        }
    }, [token, currentAccount]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.trim().length >= 2) {
            debounceRef.current = setTimeout(() => {
                searchProducts(query);
            }, 300);
        } else {
            setResults([]);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, searchProducts]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowVariants(false);
            }
        }
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setShowVariants(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleSelectProduct = (product: ProductResult) => {
        // Check if product has variations
        const hasVariations = product.type === 'variable' ||
            (product.variations && product.variations.length > 0);

        if (hasVariations && product.variations && product.variations.length > 0) {
            setSelectedProduct(product);
            setShowVariants(true);
        } else {
            // Simple product - select directly
            completeSelection(product);
        }
    };

    const handleSelectVariation = (product: ProductResult, variation: VariationResult) => {
        const variantName = variation.attributes
            ?.map(attr => attr.option)
            .join(' / ') || `Variant ${variation.wooId}`;

        onSelect({
            productId: product.id,
            wooId: product.woo_id || 0,
            variationWooId: variation.wooId,
            name: `${product.name} - ${variantName}`,
            sku: variation.sku || product.sku,
            price: variation.price || product.price,
            cogs: product.cogs,
            image: product.main_image || product.images?.[0]?.src
        });

        setQuery(`${product.name} - ${variantName}`);
        setIsOpen(false);
        setShowVariants(false);
        setSelectedProduct(null);
    };

    const completeSelection = (product: ProductResult) => {
        onSelect({
            productId: product.id,
            wooId: product.woo_id || 0,
            name: product.name,
            sku: product.sku,
            price: product.price,
            cogs: product.cogs,
            image: product.main_image || product.images?.[0]?.src
        });

        setQuery(product.name);
        setIsOpen(false);
        setResults([]);
    };

    const clearSelection = () => {
        setQuery('');
        setSelectedProduct(null);
        setShowVariants(false);
        inputRef.current?.focus();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    aria-label="Search products"
                    aria-expanded={isOpen}
                    role="combobox"
                />
                {query && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (query.length >= 2 || results.length > 0) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500">
                            <Loader2 className="animate-spin inline mr-2" size={16} />
                            Searching...
                        </div>
                    ) : showVariants && selectedProduct?.variations ? (
                        // Variant selection
                        <div>
                            <div className="px-3 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500 flex items-center gap-2">
                                <button
                                    onClick={() => setShowVariants(false)}
                                    className="text-blue-600 hover:underline"
                                >
                                    ← Back
                                </button>
                                Select variant for {selectedProduct.name}
                            </div>
                            {selectedProduct.variations.map((variation) => {
                                const variantLabel = variation.attributes
                                    ?.map(attr => attr.option)
                                    .join(' / ') || `Variant ${variation.wooId}`;

                                return (
                                    <button
                                        key={variation.wooId}
                                        type="button"
                                        onClick={() => handleSelectVariation(selectedProduct, variation)}
                                        className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{variantLabel}</div>
                                            <div className="text-xs text-gray-500">
                                                {variation.sku && <span className="mr-2">SKU: {variation.sku}</span>}
                                                {variation.stock_quantity !== undefined && (
                                                    <span>Stock: {variation.stock_quantity}</span>
                                                )}
                                            </div>
                                        </div>
                                        {variation.price !== undefined && (
                                            <span className="text-sm text-gray-600">${Number(variation.price).toFixed(2)}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No products found for "{query}"
                        </div>
                    ) : (
                        // Product list
                        results.map((product) => {
                            const hasVariations = product.type === 'variable' ||
                                (product.variations && product.variations.length > 0);

                            return (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => handleSelectProduct(product)}
                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                                >
                                    {/* Product image or placeholder */}
                                    <div className="w-10 h-10 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {product.main_image || product.images?.[0]?.src ? (
                                            <img
                                                src={product.main_image || product.images?.[0]?.src}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Package size={20} className="text-gray-300" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {product.name}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2">
                                            {product.sku && <span>SKU: {product.sku}</span>}
                                            {product.stock_quantity !== undefined && (
                                                <span className={product.stock_quantity <= 0 ? 'text-red-500' : ''}>
                                                    Stock: {product.stock_quantity}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {product.price !== undefined && (
                                            <span className="text-sm text-gray-600">
                                                ${Number(product.price).toFixed(2)}
                                            </span>
                                        )}
                                        {hasVariations && (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
