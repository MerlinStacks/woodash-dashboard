import { useState, useEffect } from 'react';
import { Search, Package2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';

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
    const { token } = useAuth();
    const { currentAccount } = useAccount();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'low'>('all');

    useEffect(() => {
        fetchProducts();
    }, [currentAccount, filter, token]);

    const fetchProducts = async () => {
        if (!currentAccount || !token) return;

        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('limit', '50');
            if (searchQuery) params.append('q', searchQuery);

            const response = await fetch(`/api/sync/products/search?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Account-ID': currentAccount.id
                }
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            let items = (data.products || data || []).map((p: any) => ({
                id: p.id,
                name: p.name || 'Unnamed Product',
                sku: p.sku || '-',
                stockQuantity: p.stock_quantity ?? p.stockQuantity ?? 0,
                lowStockThreshold: p.low_stock_amount ?? p.lowStockThreshold ?? 5,
                price: p.price || 0,
                image: p.images?.[0]?.src
            }));

            if (filter === 'low') {
                items = items.filter((p: Product) => p.stockQuantity <= p.lowStockThreshold);
            }

            setProducts(items);
        } catch (error) {
            console.error('[MobileInventory] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts();
    };

    const isLowStock = (product: Product) => product.stockQuantity <= product.lowStockThreshold;
    const lowStockCount = products.filter(isLowStock).length;

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-10 bg-gray-200 rounded-lg" />
                {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>

            {lowStockCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="text-amber-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                        <p className="font-medium text-amber-900">{lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock</p>
                        <button onClick={() => setFilter('low')} className="text-sm text-amber-700 underline">View items</button>
                    </div>
                </div>
            )}

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

            <div className="flex gap-2">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-sm font-medium ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>All Products</button>
                <button onClick={() => setFilter('low')} className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${filter === 'low' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    <AlertTriangle size={14} />Low Stock
                </button>
            </div>

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
                            <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Package2 size={24} className="text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className={`text-lg font-bold ${lowStock ? 'text-amber-600' : 'text-gray-900'}`}>{product.stockQuantity}</p>
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
