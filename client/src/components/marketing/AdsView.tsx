
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { Plus, Facebook, TrendingUp, Loader2 } from 'lucide-react';

interface AdAccount {
    id: string;
    platform: string;
    name: string;
    externalId: string;
}

interface AdInsights {
    spend: number;
    impressions: number;
    clicks: number;
    roas: number;
    currency: string;
}

export function AdsView() {
    const { token } = useAuth();
    const { currentAccount } = useAccount();
    const [accounts, setAccounts] = useState<AdAccount[]>([]);
    const [insights, setInsights] = useState<Record<string, AdInsights>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showConnect, setShowConnect] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ platform: 'META', externalId: '', accessToken: '', name: '' });

    useEffect(() => {
        fetchAccounts();
    }, [currentAccount, token]);

    async function fetchAccounts() {
        if (!currentAccount) return;
        try {
            const res = await fetch('/api/ads', {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Account-ID': currentAccount.id }
            });
            const data = await res.json();
            setAccounts(data);

            // Lazy fetch insights for each
            if (Array.isArray(data)) {
                data.forEach((acc: AdAccount) => fetchInsights(acc.id));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchInsights(adAccountId: string) {
        try {
            const res = await fetch(`/api/ads/${adAccountId}/insights`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.error) {
                setInsights(prev => ({ ...prev, [adAccountId]: data }));
            }
        } catch (err) {
            console.error(`Failed to fetch insights/`, err);
        }
    }

    async function handleConnect(e: React.FormEvent) {
        e.preventDefault();
        if (!currentAccount) return;

        try {
            const res = await fetch('/api/ads/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Account-ID': currentAccount.id
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowConnect(false);
                setFormData({ platform: 'META', externalId: '', accessToken: '', name: '' });
                fetchAccounts();
            } else {
                alert('Failed to connect');
            }
        } catch (err) {
            alert('Error connecting account');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Ad Accounts</h2>
                <button
                    onClick={() => setShowConnect(!showConnect)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={18} /> Connect Account
                </button>
            </div>

            {/* Connect Form */}
            {showConnect && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <h3 className="font-semibold mb-4">Connect Ad Platform</h3>
                    <form onSubmit={handleConnect} className="grid gap-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={formData.platform}
                                onChange={e => setFormData({ ...formData, platform: e.target.value })}
                            >
                                <option value="META">Meta Ads (Facebook/Instagram)</option>
                                <option value="GOOGLE">Google Ads</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name (Optional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg"
                                placeholder="e.g. Summer Campaign Account"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Account ID</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg"
                                placeholder="act_123456789"
                                value={formData.externalId}
                                onChange={e => setFormData({ ...formData, externalId: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                            <input
                                type="password"
                                className="w-full p-2 border rounded-lg"
                                placeholder="EAA..."
                                value={formData.accessToken}
                                onChange={e => setFormData({ ...formData, accessToken: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                For testing, get a User Access Token from <a href="https://developers.facebook.com/tools/explorer/" target="_blank" className="text-blue-600 underline">Graph API Explorer</a>.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setShowConnect(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-12"><Loader2 className="animate-spin inline text-gray-400" /></div>
                ) : accounts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        No ad accounts connected.
                    </div>
                ) : (
                    accounts.map(acc => {
                        const ins = insights[acc.id];
                        return (
                            <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            {acc.platform === 'META' ? <Facebook size={24} /> : <TrendingUp size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{acc.name}</h3>
                                            <p className="text-xs text-gray-500 font-mono">{acc.externalId}</p>
                                        </div>
                                    </div>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                                </div>

                                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Spend (30d)</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {ins ? new Intl.NumberFormat('en-US', { style: 'currency', currency: ins.currency }).format(ins.spend) : '...'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">ROAS</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {ins ? ins.roas.toFixed(2) + 'x' : '...'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Impressions</p>
                                        <p className="font-medium text-gray-700">
                                            {ins ? new Intl.NumberFormat('en-US', { notation: "compact" }).format(ins.impressions) : '...'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Clicks</p>
                                        <p className="font-medium text-gray-700">
                                            {ins ? new Intl.NumberFormat('en-US').format(ins.clicks) : '...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
