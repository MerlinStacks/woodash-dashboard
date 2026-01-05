import { useState, useEffect } from 'react';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, ExternalLink, RefreshCw, Box } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccount } from '../context/AccountContext';
import { SeoScoreBadge } from '../components/Seo/SeoScoreBadge';
import { SeoAnalysisPanel } from '../components/Seo/SeoAnalysisPanel';
import { MerchantCenterPanel } from '../components/Seo/MerchantCenterPanel';
import { GeneralInfoPanel } from '../components/products/GeneralInfoPanel';
import { LogisticsPanel } from '../components/products/LogisticsPanel';
import { VariationsPanel } from '../components/products/VariationsPanel';
import { PricingPanel } from '../components/products/PricingPanel';
import { BOMPanel } from '../components/products/BOMPanel';
import { GoldPricePanel } from '../components/products/GoldPricePanel';

interface ProductData {
    id: string;
    wooId: number;
    name: string;
    sku: string;
    permalink: string;
    description: string;
    shortDescription: string;
    price: string;
    regularPrice: string;
    salePrice: string;
    stockStatus: string;
    stockQuantity: number | null;
    manageStock: boolean;
    weight: string;
    dimensions: {
        length: string;
        width: string;
        height: string;
    };
    binLocation?: string;
    mainImage?: string;

    // Intelligence
    seoScore?: number;
    seoData?: any;
    merchantCenterScore?: number;
    merchantCenterIssues?: any;

    // Gold Price
    isGoldPriceApplied?: boolean;

    // Woo Specific
    type?: 'simple' | 'variable' | 'grouped' | 'external';
    variations?: number[]; // IDs
    rawData?: any;
}

interface ProductVariant {
    id: number;
    sku: string;
    price: string;
    attributes: any[];
}

export function ProductEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { currentAccount } = useAccount();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [product, setProduct] = useState<ProductData | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        salePrice: '',
        stockStatus: 'instock',
        binLocation: '',
        description: '',
        focusKeyword: '',
        isGoldPriceApplied: false
    });

    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [isLoadingVariants, setIsLoadingVariants] = useState(false);

    useEffect(() => {
        if (!currentAccount || !id) return;
        fetchProduct();
    }, [currentAccount, id, token]);

    const fetchProduct = async () => {
        setIsLoading(true);
        try {
            // Check if id is wooId or uuid. The route is /inventory/product/:id
            // Assuming we passed UUID or WooID. The API currently supports WooID via /api/products/:id (which expects number)
            // If the inventory page passes UUID, we might need a different endpoint or logic.
            // Let's assume for now we are passing WooID as that matches the API /api/products/:id

            const res = await fetch(`/api/products/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Account-ID': currentAccount!.id
                }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Product Data Loaded:', data); // Debug
                setProduct(data);
                setFormData({
                    name: data.name || '',
                    sku: data.sku || '',
                    price: data.price ? data.price.toString() : '',
                    salePrice: data.salePrice ? data.salePrice.toString() : '',
                    stockStatus: data.stockStatus || 'instock',
                    binLocation: data.binLocation || '',
                    description: data.description || data.short_description || '', // Try both
                    focusKeyword: (data.seoData?.focusKeyword) ? data.seoData.focusKeyword : (data.name || ''), // Explicit check
                    isGoldPriceApplied: data.isGoldPriceApplied || false
                });

                console.log('[DEBUG] Product Type:', data.type, 'Variations:', data.variations);

                // Load variants if variable
                if (data.type === 'variable' && data.variations?.length) {
                    fetchVariants(data.variations);
                }
            } else {
                throw new Error('Failed to load product');
            }
        } catch (error) {
            console.error(error);
            // alert('Error loading product'); 
        } finally {
            setIsLoading(false);
        }
    };

    const fetchVariants = async (variantIds: number[]) => {
        setIsLoadingVariants(true);
        // Mocking variant fetch for now, as we might need a dedicated endpoint or bulk fetch
        // In a real scenario, we'd hit /api/products/variants?ids=... or similar
        // For now, let's assume we can't easily fetch them without an endpoint update.
        // We'll show a placeholder list based on IDs.
        try {
            // Placeholder logic
            const mockVariants = variantIds.map(id => ({
                id,
                sku: `VAR-${id}`, // Placeholder
                price: '...',
                attributes: []
            }));
            setVariants(mockVariants);
        } finally {
            setIsLoadingVariants(false);
        }
    };

    const handleSave = async () => {
        if (!currentAccount || !id) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Account-ID': currentAccount.id
                },
                body: JSON.stringify({
                    name: formData.name, // Note: Updates to name might need to sync back to Woo
                    binLocation: formData.binLocation,
                    stockStatus: formData.stockStatus,
                    isGoldPriceApplied: formData.isGoldPriceApplied
                    // Add other fields when backend supports them
                })
            });

            if (res.ok) {
                // Success feedback?
                fetchProduct(); // Reload
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
                <button onClick={() => navigate('/inventory')} className="mt-4 text-blue-600 hover:underline">
                    Back to Inventory
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/inventory')}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">ID: {product.wooId}</span>
                            {product.sku && <span>SKU: {product.sku}</span>}
                            <span>•</span>
                            <a
                                href={product.permalink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                                View on Store <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        <RefreshCw size={18} /> Sync from Woo
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Editable Fields */}
                <div className="lg:col-span-2 space-y-6">

                    <GeneralInfoPanel
                        formData={formData}
                        onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                        product={product}
                    />

                    <LogisticsPanel
                        formData={formData}
                        onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                    />

                    <VariationsPanel
                        product={product}
                        variants={variants}
                        onManage={() => window.open(`${currentAccount?.wooUrl}/wp-admin/post.php?post=${product.wooId}&action=edit`, '_blank')}
                    />

                    <PricingPanel formData={formData} />

                    <GoldPricePanel
                        product={{ ...product, isGoldPriceApplied: formData.isGoldPriceApplied }}
                        onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                    />

                    <BOMPanel productId={product.id} />

                </div>

                {/* Right Column: Intelligence & Summaries */}
                <div className="space-y-6">

                    {/* Media */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4">
                            {product.mainImage ? (
                                <img src={product.mainImage} alt="" className="w-full h-auto rounded-lg border border-gray-100" />
                            ) : (
                                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                    <Box size={48} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SEO Intelligence */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">SEO Intelligence</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Read-Only</span>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-medium text-gray-600">Overall Score</span>
                                <SeoScoreBadge score={product.seoScore || 0} size="md" />
                            </div>
                            <SeoAnalysisPanel
                                score={product.seoScore || 0}
                                tests={product.seoData?.analysis || []}
                                focusKeyword={formData.focusKeyword}
                            />
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keyword</label>
                                <input
                                    type="text"
                                    value={formData.focusKeyword}
                                    onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Primary keyword this product targets. Automatically filled from product name if empty.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Merchant Center */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Google Merchant Center</h3>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <MerchantCenterPanel
                                score={product.merchantCenterScore || 0}
                                issues={product.merchantCenterIssues || []}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
