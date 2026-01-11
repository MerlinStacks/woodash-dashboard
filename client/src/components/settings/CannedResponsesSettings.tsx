/**
 * Canned Responses Settings Component.
 * Full CRUD interface for managing canned response templates with categories.
 */
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Save, X, Zap, FolderOpen, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { cn } from '../../utils/cn';

interface CannedResponse {
    id: string;
    shortcut: string;
    content: string;
    category: string | null;
}

const DEFAULT_CATEGORIES = ['General', 'Shipping', 'Returns', 'Payments', 'Products'];

export function CannedResponsesSettings() {
    const { token } = useAuth();
    const { currentAccount } = useAccount();
    const [responses, setResponses] = useState<CannedResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        shortcut: '',
        content: '',
        category: ''
    });

    const fetchResponses = useCallback(async () => {
        if (!currentAccount || !token) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/chat/canned-responses', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-account-id': currentAccount.id
                }
            });
            if (res.ok) {
                setResponses(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch canned responses:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentAccount, token]);

    useEffect(() => {
        fetchResponses();
    }, [fetchResponses]);

    const handleSave = async () => {
        if (!formData.shortcut.trim() || !formData.content.trim()) return;

        const payload = {
            shortcut: formData.shortcut.trim(),
            content: formData.content.trim(),
            category: formData.category.trim() || null
        };

        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId
                ? `/api/chat/canned-responses/${editingId}`
                : '/api/chat/canned-responses';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-account-id': currentAccount?.id || ''
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setFormData({ shortcut: '', content: '', category: '' });
                setEditingId(null);
                fetchResponses();
            }
        } catch (error) {
            console.error('Failed to save canned response:', error);
        }
    };

    const handleEdit = (response: CannedResponse) => {
        setEditingId(response.id);
        setFormData({
            shortcut: response.shortcut,
            content: response.content,
            category: response.category || ''
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this canned response?')) return;
        try {
            await fetch(`/api/chat/canned-responses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-account-id': currentAccount?.id || ''
                }
            });
            fetchResponses();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ shortcut: '', content: '', category: '' });
    };

    // Get unique categories from responses
    const existingCategories = [...new Set(responses.map(r => r.category).filter(Boolean) as string[])];
    const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...existingCategories])].sort();

    // Group responses by category
    const groupedResponses = responses.reduce((acc, response) => {
        const cat = response.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(response);
        return acc;
    }, {} as Record<string, CannedResponse[]>);

    // Filter by search
    const filteredGroups = Object.entries(groupedResponses)
        .map(([category, items]) => ({
            category,
            items: items.filter(r =>
                r.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.content.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }))
        .filter(g => g.items.length > 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Canned Responses</h2>
                    <p className="text-sm text-gray-500">
                        Create reusable message templates. Type "/" in the chat to use them.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Zap size={14} className="text-amber-500" />
                    Supports placeholders: {`{{customer.firstName}}`}, {`{{customer.email}}`}
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search responses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
            </div>

            {/* Add/Edit Form */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                    {editingId ? 'Edit Response' : 'Add New Response'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Shortcut</label>
                        <input
                            type="text"
                            placeholder="e.g. hi, refund, shipping"
                            value={formData.shortcut}
                            onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option value="">No Category</option>
                            {allCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={handleSave}
                            disabled={!formData.shortcut.trim() || !formData.content.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingId ? <Save size={14} /> : <Plus size={14} />}
                            {editingId ? 'Save' : 'Add'}
                        </button>
                        {editingId && (
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                            >
                                <X size={14} />
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
                <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                    <textarea
                        placeholder="Type your response here... Use {{customer.firstName}} for placeholders."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                </div>
            </div>

            {/* Responses List */}
            {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No responses match your search.' : 'No canned responses yet. Add your first one above!'}
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredGroups.map(({ category, items }) => (
                        <div key={category}>
                            <div className="flex items-center gap-2 mb-2">
                                <FolderOpen size={14} className="text-gray-400" />
                                <h4 className="text-sm font-medium text-gray-700">{category}</h4>
                                <span className="text-xs text-gray-400">({items.length})</span>
                            </div>
                            <div className="space-y-2">
                                {items.map((response) => (
                                    <div
                                        key={response.id}
                                        className={cn(
                                            "bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors",
                                            editingId === response.id && "ring-2 ring-blue-500/20 border-blue-500"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <code className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                                        /{response.shortcut}
                                                    </code>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2">{response.content}</p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleEdit(response)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(response.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
