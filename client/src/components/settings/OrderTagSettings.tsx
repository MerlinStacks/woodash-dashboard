import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { Loader2, Save, Tag, Plus } from 'lucide-react';

interface TagMapping {
    productTag: string;
    orderTag: string;
    enabled: boolean;
}

/**
 * Settings component for configuring product tag to order tag mappings.
 * Allows users to define which product tags should be applied to orders.
 */
export function OrderTagSettings() {
    const { token } = useAuth();
    const { currentAccount } = useAccount();

    const [productTags, setProductTags] = useState<string[]>([]);
    const [mappings, setMappings] = useState<TagMapping[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!currentAccount || !token) return;
        loadData();
    }, [currentAccount, token]);

    async function loadData() {
        if (!currentAccount || !token) return;
        setIsLoading(true);

        try {
            // Fetch product tags and existing mappings in parallel
            const [tagsRes, mappingsRes] = await Promise.all([
                fetch(`/api/accounts/${currentAccount.id}/product-tags`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`/api/accounts/${currentAccount.id}/tag-mappings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const tagsData = await tagsRes.json();
            const mappingsData = await mappingsRes.json();

            setProductTags(tagsData.tags || []);
            setMappings(mappingsData.mappings || []);
        } catch (error) {
            console.error('Failed to load tag settings', error);
        } finally {
            setIsLoading(false);
        }
    }

    function getMappingForTag(productTag: string): TagMapping | undefined {
        return mappings.find(m => m.productTag.toLowerCase() === productTag.toLowerCase());
    }

    function updateMapping(productTag: string, updates: Partial<TagMapping>) {
        setMappings(prev => {
            const existing = prev.find(m => m.productTag.toLowerCase() === productTag.toLowerCase());
            if (existing) {
                return prev.map(m =>
                    m.productTag.toLowerCase() === productTag.toLowerCase()
                        ? { ...m, ...updates }
                        : m
                );
            } else {
                // Create new mapping
                return [...prev, {
                    productTag,
                    orderTag: updates.orderTag || productTag,
                    enabled: updates.enabled ?? false
                }];
            }
        });
    }

    async function handleSave() {
        if (!currentAccount || !token) return;
        setIsSaving(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/accounts/${currentAccount.id}/tag-mappings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mappings })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Tag mappings saved! Re-sync orders to apply changes.' });
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save tag mappings' });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <Tag className="text-blue-600" size={20} />
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Order Tag Mappings</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Configure which product tags should be applied to orders.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {productTags.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Tag size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No product tags found.</p>
                        <p className="text-sm">Sync your products to see available tags.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase px-2">
                            <div className="col-span-1">Enable</div>
                            <div className="col-span-4">Product Tag</div>
                            <div className="col-span-1 text-center">→</div>
                            <div className="col-span-6">Order Tag Name</div>
                        </div>

                        {productTags.map(productTag => {
                            const mapping = getMappingForTag(productTag);
                            const isEnabled = mapping?.enabled ?? false;
                            const orderTag = mapping?.orderTag || productTag;

                            return (
                                <div
                                    key={productTag}
                                    className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg border transition-colors ${isEnabled ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'
                                        }`}
                                >
                                    <div className="col-span-1">
                                        <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={(e) => updateMapping(productTag, { enabled: e.target.checked })}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                                            {productTag}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-center text-gray-400">→</div>
                                    <div className="col-span-6">
                                        <input
                                            type="text"
                                            value={orderTag}
                                            onChange={(e) => updateMapping(productTag, { orderTag: e.target.value })}
                                            disabled={!isEnabled}
                                            placeholder="Order tag name"
                                            className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isEnabled ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200 text-gray-400'
                                                }`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || productTags.length === 0}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Mappings
                    </button>
                </div>
            </div>
        </div>
    );
}
