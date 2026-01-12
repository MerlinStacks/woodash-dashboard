import { useState, useEffect } from 'react';
import {
    Search,
    Package2,
    AlertTriangle,
    ChevronRight,
    Filter
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import api from '../../services/api';

/**
 * MobileInventory - Quick inventory view for mobile.
 * 
 * Features:
 * - Low stock alerts
 * - Search products
 * - Quick stock update
 */

interface Product {
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    lowStockThreshold: number;
    price: number;
    image?: string;
}

export function MobileInventory() {
    const { currentAccount } = useAccount();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'low'>('all');

    useEffect(() => {
        fetchProducts();
    }, [currentAccount, filter]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/inventory/products', {
                params: {
                    limit: 50,
                    lowStock: filter === 'low' ? true : undefined,
                    search: searchQuery || undefined
                }
            });

            const items = (response.data.products || []).map((p: any) => ({
                id: p.id,
                name: p.name || 'Unnamed Product',
                sku: p.sku || '-',
                stockQuantity: p.stockQuantity || 0,
                lowStockThreshold: p.lowStockThreshold || 5,
                price: p.price || 0,
                image: p.images?.[0]?.src
            }));

            setProducts(items);
        } catch (error) {
            console.error('[MobileInventory] Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts();
    };

    const isLowStock = (product: Product) => {
        return product.stockQuantity <= product.lowStockThreshold;
    };

    const lowStockCount = products.filter(isLowStock).length;

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-10 bg-gray-200 rounded-lg" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>

            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="text-amber-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                        <p className="font-medium text-amber-900">
                            {lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock
                        </p>
                        <button
                            onClick={() => setFilter('low')}
                            className="text-sm text-amber-700 underline"
                        >
                            View items
                        </button>
                    </div>
                </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </form>

            {/* Filter Chips */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                >
                    All Products
                </button>
                <button
                    onClick={() => setFilter('low')}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${filter === 'low' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                >
                    <AlertTriangle size={14} />
                    Low Stock
                </button>
            </div>

            {/* Products List */}
            <div className="space-y-3">
                {products.length === 0 ? (
                    <div className="text-center py-12">
                        <Package2 className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500">No products found</p>
                    </div>
                ) : (
                    products.map((product) => {
                        const lowStock = isLowStock(product);

                        return (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
                            >
                                {/* Product Image */}
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Package2 size={24} className="text-gray-400" />
                                    </div>
                                )}

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {product.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        SKU: {product.sku}
                                    </p>
                                </div>

                                {/* Stock Quantity */}
                                <div className="text-right flex-shrink-0">
                                    <p className={`text-lg font-bold ${lowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                                        {product.stockQuantity}
                                    </p>
                                    <p className="text-xs text-gray-500">in stock</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
