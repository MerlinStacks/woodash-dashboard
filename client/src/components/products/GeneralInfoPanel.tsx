import React from 'react';
import { Eye, AlertTriangle } from 'lucide-react';

interface GeneralInfoPanelProps {
    formData: {
        name: string;
        description: string;
        sku: string;
        stockStatus: string;
    };
    onChange: (data: Partial<GeneralInfoPanelProps['formData']>) => void;
    product: {
        shortDescription?: string;
        description?: string;
    };
}

export const GeneralInfoPanel: React.FC<GeneralInfoPanelProps> = ({ formData, onChange, product }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">General Information</h3>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => onChange({ name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <button
                            disabled
                            className="text-xs flex items-center gap-1 text-gray-400 font-medium cursor-not-allowed"
                            title="Visual Editor disabled due to dependency issue"
                        >
                            <Eye size={12} /> Visual Editor Disabled
                        </button>
                    </div>
                    {product.shortDescription && !product.description && (
                        <div className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            Using Short Description as fallback
                        </div>
                    )}
                    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                        <textarea
                            value={formData.description}
                            onChange={(e) => onChange({ description: e.target.value })}
                            className="w-full h-72 p-4 font-mono text-sm outline-none resize-none bg-gray-50"
                            placeholder="<p>Enter HTML description...</p>"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                        <input
                            type="text"
                            value={formData.sku}
                            disabled // Usually managed via Sync or specific flow
                            className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">SKU changes should originate from WooCommerce</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={formData.stockStatus}
                            onChange={(e) => onChange({ stockStatus: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="instock">In Stock</option>
                            <option value="outofstock">Out of Stock</option>
                            <option value="onbackorder">On Backorder</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
