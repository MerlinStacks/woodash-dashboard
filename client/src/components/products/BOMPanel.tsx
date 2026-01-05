import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';

interface BOMPanelProps {
    productId: string; // Internal UUID
}

interface BOMItem {
    supplierItemId: string;
    quantity: number | string;
    wasteFactor: number | string;
    supplierItem?: {
        name: string;
        cost: number;
        leadTime: number;
    };
}

export function BOMPanel({ productId }: BOMPanelProps) {
    const { token } = useAuth();
    const { currentAccount } = useAccount();
    const [bomItems, setBomItems] = useState<BOMItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availableItems, setAvailableItems] = useState<any[]>([]); // All SupplierItems for dropdown

    useEffect(() => {
        if (!currentAccount || !productId) return;

        // Parallel fetch: Existing BOM + All Supplier Items
        Promise.all([
            fetch(`/api/inventory/products/${productId}/bom`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Account-ID': currentAccount.id }
            }).then(res => res.json()),
            fetch(`/api/inventory/suppliers`, { // Fetching suppliers to flatten items
                headers: { 'Authorization': `Bearer ${token}`, 'X-Account-ID': currentAccount.id }
            }).then(res => res.json())
        ]).then(([bomData, suppliersData]) => {
            // Map BOM items
            const loadedItems = bomData.items?.map((i: any) => ({
                supplierItemId: i.supplierItemId,
                quantity: i.quantity,
                wasteFactor: i.wasteFactor,
                supplierItem: i.supplierItem
            })) || [];

            setBomItems(loadedItems);

            // Flatten suppliers to get all available items
            const allItems: any[] = [];
            if (Array.isArray(suppliersData)) {
                suppliersData.forEach((s: any) => {
                    if (s.items) {
                        s.items.forEach((i: any) => {
                            allItems.push({ ...i, supplierName: s.name });
                        });
                    }
                });
            }
            setAvailableItems(allItems);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [productId, currentAccount, token]);

    const handleAddItem = (e: any) => {
        const itemId = e.target.value;
        if (!itemId) return;

        const itemDef = availableItems.find(i => i.id === itemId);
        if (!itemDef) return;

        // Check if already added
        if (bomItems.some(item => item.supplierItemId === itemId)) {
            alert('Item already in BOM');
            return;
        }

        setBomItems([...bomItems, {
            supplierItemId: itemId,
            quantity: 1,
            wasteFactor: 0,
            supplierItem: itemDef
        }]);
    };

    const handleSave = async () => {
        if (!currentAccount || !productId) return;
        setSaving(true);
        try {
            // Sanitize functionality: ensure numbers before sending
            const itemsToSave = bomItems.map(item => ({
                ...item,
                quantity: Number(item.quantity) || 0,
                wasteFactor: Number(item.wasteFactor) || 0
            }));

            await fetch(`/api/inventory/products/${productId}/bom`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Account-ID': currentAccount.id
                },
                body: JSON.stringify({ items: itemsToSave })
            });
            // alert('BOM Saved!'); // Inline feedback preferred?
        } catch (error) {
            console.error(error);
            alert('Failed to save BOM');
        } finally {
            setSaving(false);
        }
    };

    // Calculations
    const totalCost = bomItems.reduce((acc, item) => {
        const qty = Number(item.quantity) || 0;
        const waste = Number(item.wasteFactor) || 0;
        const baseCost = (qty * (item.supplierItem?.cost || 0));
        const wasteCost = baseCost * waste;
        return acc + baseCost + wasteCost;
    }, 0);

    const maxLeadTime = bomItems.reduce((max, item) => {
        return Math.max(max, item.supplierItem?.leadTime || 0);
    }, 0);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-center">
                <Loader2 className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Bill of Materials (BOM)</h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-700 mb-1">
                            <DollarSign size={18} />
                            <span className="font-semibold text-sm uppercase">Total Cost</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                            <Calendar size={18} />
                            <span className="font-semibold text-sm uppercase">Max Lead Time</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{maxLeadTime} days</div>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">Components & Materials</h3>
                        <select
                            className="border p-1.5 rounded-lg text-xs bg-white shadow-sm outline-none focus:border-blue-500"
                            onChange={handleAddItem}
                            value=""
                        >
                            <option value="">+ Add Component...</option>
                            {availableItems.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} (${Number(item.cost).toFixed(2)}) - {item.supplierName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="p-3 text-left pl-4 font-medium">Component</th>
                                    <th className="p-3 w-24 font-medium">Qty</th>
                                    <th className="p-3 w-24 font-medium">Waste %</th>
                                    <th className="p-3 text-right font-medium">Subtotal</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bomItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-sm text-gray-400">
                                            No components added yet.
                                        </td>
                                    </tr>
                                ) : (
                                    bomItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="p-3 pl-4">
                                                <div className="font-medium text-sm text-gray-900">{item.supplierItem?.name}</div>
                                                <div className="text-xs text-gray-500">${Number(item.supplierItem?.cost).toFixed(2)} / unit</div>
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number" min="0" step="any"
                                                    value={item.quantity}
                                                    onChange={e => {
                                                        const newItems = [...bomItems];
                                                        newItems[idx].quantity = e.target.value;
                                                        setBomItems(newItems);
                                                    }}
                                                    className="w-full border rounded p-1 text-center text-sm"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    value={item.wasteFactor}
                                                    onChange={e => {
                                                        const newItems = [...bomItems];
                                                        newItems[idx].wasteFactor = e.target.value;
                                                        setBomItems(newItems);
                                                    }}
                                                    className="w-full border rounded p-1 text-center text-sm"
                                                />
                                            </td>
                                            <td className="p-3 text-right text-sm font-medium text-gray-900">
                                                $ {(
                                                    (Number(item.quantity) || 0) * (item.supplierItem?.cost || 0) * (1 + (Number(item.wasteFactor) || 0))
                                                ).toFixed(2)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => setBomItems(bomItems.filter((_, i) => i !== idx))}
                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
