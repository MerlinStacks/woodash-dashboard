import React from 'react';

interface PricingPanelProps {
    formData: {
        price: string;
        salePrice: string;
    };
}

export const PricingPanel: React.FC<PricingPanelProps> = ({ formData }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-75">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Pricing</h3>
                <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Coming Soon</span>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            type="text"
                            value={formData.price}
                            disabled
                            className="w-full pl-8 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg cursor-not-allowed"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            type="text"
                            value={formData.salePrice}
                            disabled
                            className="w-full pl-8 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
