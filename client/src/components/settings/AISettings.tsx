import { useState, useEffect } from 'react';
import { useAccount } from '../../context/AccountContext';
import { useAuth } from '../../context/AuthContext';
import { Save, Loader2, Bot, Key } from 'lucide-react';

export function AISettings() {
    const { currentAccount, refreshAccounts } = useAccount();
    const { token } = useAuth();

    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('mistralai/mistral-7b-instruct');
    const [models, setModels] = useState<any[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentAccount) {
            setApiKey(currentAccount.openRouterApiKey || '');
            if (currentAccount.aiModel) {
                setSelectedModel(currentAccount.aiModel);
            }
        }
    }, [currentAccount]);

    useEffect(() => {
        const fetchModels = async () => {
            if (!currentAccount || !token) return;
            // Only fetch if we have a key saved (or maybe standard list?)
            // If the user hasn't saved a key yet, we might not get models unless we use a default key on backend.
            // But let's try fetching anyway.
            setIsLoadingModels(true);
            try {
                const res = await fetch('/api/ai/models', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-account-id': currentAccount.id
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const sorted = data.sort((a: any, b: any) => a.id.localeCompare(b.id));
                        setModels(sorted);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch models", e);
            } finally {
                setIsLoadingModels(false);
            }
        };

        // Fetch on mount
        fetchModels();
    }, [currentAccount?.id, token]); // Only re-fetch if account changes

    const handleSave = async () => {
        if (!currentAccount || !token) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/accounts/${currentAccount.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    openRouterApiKey: apiKey,
                    aiModel: selectedModel
                })
            });

            if (!res.ok) throw new Error('Failed to save');

            await refreshAccounts();
            alert('AI Settings Saved');

        } catch (e) {
            console.error(e);
            alert('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Key size={16} /> OpenRouter API Key
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                        placeholder="sk-or-v1-..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">openrouter.ai</a>
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Bot size={16} /> AI Model
                    </label>
                    <div className="relative">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={isLoadingModels}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                        >
                            <option value="mistralai/mistral-7b-instruct">Mistral 7B Instruct (Default)</option>
                            {models.map(model => (
                                <option key={model.id} value={model.id}>
                                    {model.name} ({model.id})
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            {isLoadingModels ? <Loader2 size={16} className="animate-spin text-gray-400" /> : <span className="text-gray-400">▼</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Saving...' : 'Save AI Settings'}
                </button>
            </div>
        </div>
    );
}
