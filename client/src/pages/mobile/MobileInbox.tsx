import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';

interface Conversation {
    id: string;
    customerName: string;
    lastMessage: string;
    channel: string;
    unread: boolean;
    updatedAt: string;
}

const CHANNEL_COLORS: Record<string, string> = {
    email: 'bg-blue-500',
    facebook: 'bg-blue-600',
    instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
    tiktok: 'bg-black',
    default: 'bg-gray-500'
};

export function MobileInbox() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { currentAccount } = useAccount();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();
    }, [currentAccount, token]);

    const fetchConversations = async () => {
        if (!currentAccount || !token) return;

        try {
            setLoading(true);
            const response = await fetch('/api/conversations?limit=50', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Account-ID': currentAccount.id
                }
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            const convos = (data.conversations || data || []).map((c: any) => ({
                id: c.id,
                customerName: c.customerName || c.customerEmail || 'Unknown',
                lastMessage: c.lastMessage?.body || c.snippet || 'No messages',
                channel: c.channel || 'email',
                unread: c.status === 'open' || c.unreadCount > 0,
                updatedAt: c.updatedAt
            }));
            setConversations(convos);
        } catch (error) {
            console.error('[MobileInbox] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (date: string) => {
        if (!date) return '';
        const now = new Date();
        const then = new Date(date);
        const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
        if (diff < 60) return 'Now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return then.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    };

    const getChannelColor = (channel: string) => CHANNEL_COLORS[channel.toLowerCase()] || CHANNEL_COLORS.default;
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-3 p-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {conversations.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500">No conversations yet</p>
                    </div>
                ) : (
                    conversations.map((convo) => (
                        <button
                            key={convo.id}
                            onClick={() => navigate(`/m/inbox/${convo.id}`)}
                            className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-50"
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                    {getInitials(convo.customerName)}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getChannelColor(convo.channel)} flex items-center justify-center ring-2 ring-white`}>
                                    <Mail size={10} className="text-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-semibold truncate ${convo.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {convo.customerName}
                                    </span>
                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                        {formatTimeAgo(convo.updatedAt)}
                                    </span>
                                </div>
                                <p className={`text-sm truncate ${convo.unread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                    {convo.lastMessage}
                                </p>
                            </div>
                            {convo.unread && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full flex-shrink-0" />}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
