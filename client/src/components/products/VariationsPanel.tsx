import React from 'react';

interface ProductVariant {
    id: number;
    sku: string;
    price: string;
    attributes: any[];
}

interface VariationsPanelProps {
    product: {
        type?: string;
        variations?: number[];
    };
    variants: ProductVariant[];
    onManage?: () => void;
}

export const VariationsPanel: React.FC<VariationsPanelProps> = ({ product, variants, onManage }) => {
    if (product.type !== 'variable') return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Variations</h3>
                    <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">{product.variations?.length || 0}</span>
                </div>
                <button
                    onClick={onManage}
                    className="text-sm text-blue-600 font-medium hover:underline"
                >
                    Manage in WooCommerce
                </button>
            </div>
            <div className="p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">SKU</th>
                            <th className="px-6 py-3">Price</th>
                            <th className="px-6 py-3">Attributes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {variants.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No variations loaded via API yet.</td></tr>
                        ) : (
                            variants.map(v => (
                                <tr key={v.id} className="hover:bg-blue-50/50 transition-colors group cursor-default">
                                    <td className="px-6 py-4 font-mono text-gray-500">#{v.id}</td>
                                    <td className="px-6 py-4 font-mono font-medium text-gray-700">{v.sku}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{v.price}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600">
                                            Placeholder Attributes
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
