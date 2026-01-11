/**
 * BulkActionToolbar
 * 
 * Floating toolbar that appears when conversations are selected.
 * Provides bulk actions: Close, Assign, Add Label.
 */

import { useState } from 'react';
import { X, CheckCircle, UserPlus, Tag, Loader2, XCircle, FolderOpen } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';

interface BulkActionToolbarProps {
    selectedIds: string[];
    onClearSelection: () => void;
    onActionComplete: () => void;
    users?: { id: string; fullName: string }[];
    labels?: { id: string; name: string; color: string }[];
}

type BulkAction = 'close' | 'open' | 'assign' | 'addLabel';

export function BulkActionToolbar({
    selectedIds,
    onClearSelection,
    onActionComplete,
    users = [],
    labels = [],
}: BulkActionToolbarProps) {
    const { token } = useAuth();
    const { currentAccount } = useAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);
    const [showLabelDropdown, setShowLabelDropdown] = useState(false);

    const performBulkAction = async (
        action: BulkAction,
        options?: { labelId?: string; assignToUserId?: string }
    ) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/chat/conversations/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-account-id': currentAccount?.id || '',
                },
                body: JSON.stringify({
                    conversationIds: selectedIds,
                    action,
                    ...options,
                }),
            });

            if (res.ok) {
                onActionComplete();
                onClearSelection();
            } else {
                const data = await res.json();
                console.error('Bulk action failed:', data.error);
            }
        } catch (error) {
            console.error('Bulk action error:', error);
        } finally {
            setIsLoading(false);
            setShowAssignDropdown(false);
            setShowLabelDropdown(false);
        }
    };

    if (selectedIds.length === 0) return null;

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
                {/* Selection Count */}
                <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
                    <span className="text-sm font-medium text-white">
                        {selectedIds.length} selected
                    </span>
                    <button
                        onClick={onClearSelection}
                        className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                        aria-label="Clear selection"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                    {/* Close */}
                    <button
                        onClick={() => performBulkAction('close')}
                        disabled={isLoading}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
                            'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <XCircle className="w-4 h-4" />
                        )}
                        Close
                    </button>

                    {/* Reopen */}
                    <button
                        onClick={() => performBulkAction('open')}
                        disabled={isLoading}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
                            'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                    >
                        <FolderOpen className="w-4 h-4" />
                        Reopen
                    </button>

                    {/* Assign */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowAssignDropdown(!showAssignDropdown);
                                setShowLabelDropdown(false);
                            }}
                            disabled={isLoading}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
                                'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                showAssignDropdown && 'bg-gray-700 text-white'
                            )}
                        >
                            <UserPlus className="w-4 h-4" />
                            Assign
                        </button>

                        {/* Assign Dropdown */}
                        {showAssignDropdown && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
                                {users.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-500">No users available</div>
                                ) : (
                                    users.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => performBulkAction('assign', { assignToUserId: user.id })}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-200 hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white">
                                                {user.fullName?.charAt(0) || '?'}
                                            </div>
                                            {user.fullName || 'Unknown'}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Add Label */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowLabelDropdown(!showLabelDropdown);
                                setShowAssignDropdown(false);
                            }}
                            disabled={isLoading}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
                                'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                showLabelDropdown && 'bg-gray-700 text-white'
                            )}
                        >
                            <Tag className="w-4 h-4" />
                            Label
                        </button>

                        {/* Label Dropdown */}
                        {showLabelDropdown && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
                                {labels.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-500">No labels created</div>
                                ) : (
                                    labels.map((label) => (
                                        <button
                                            key={label.id}
                                            onClick={() => performBulkAction('addLabel', { labelId: label.id })}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-200 hover:bg-gray-700 transition-colors"
                                        >
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: label.color }}
                                            />
                                            {label.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
