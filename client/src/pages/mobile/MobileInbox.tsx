import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    MessageSquare,
    Mail,
    Send,
    Paperclip,
    MoreVertical
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import api from '../../services/api';

/**
 * MobileInbox - Conversation list and chat view for mobile.
 * 
 * Features:
 * - Conversation list with channel badges
 * - Unread indicators
 * - Tap to open chat
 * - Channel icons (Email, FB, Instagram, TikTok)
 */

interface Conversation {
    id: string;
    customerName: string;
    lastMessage: string;
    channel: string;
    unread: boolean;
    updatedAt: string;
    avatar?: string;
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
    const { currentAccount } = useAccount();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeConversation, setActiveConversation] = useState<string | null>(null);

    useEffect(() => {
        fetchConversations();
    }, [currentAccount]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/conversations', {
                params: { limit: 50, sort: 'updatedAt:desc' }
            });

            const convos = (response.data.conversations || []).map((c: any) => ({
                id: c.id,
                customerName: c.customerName || c.customerEmail || 'Unknown',
                lastMessage: c.lastMessage?.body || 'No messages',
                channel: c.channel || 'email',
                unread: c.status === 'open' || c.unreadCount > 0,
                updatedAt: c.updatedAt,
                avatar: c.customerAvatar
            }));

            setConversations(convos);
        } catch (error) {
            console.error('[MobileInbox] Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (diff < 60) return 'Now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
        return then.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    };

    const getChannelColor = (channel: string) => {
        return CHANNEL_COLORS[channel.toLowerCase()] || CHANNEL_COLORS.default;
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

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
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>

            {/* Conversations List */}
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
                            className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-50 transition-colors"
                        >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                {convo.avatar ? (
                                    <img
                                        src={convo.avatar}
                                        alt={convo.customerName}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                        {getInitials(convo.customerName)}
                                    </div>
                                )}
                                {/* Channel badge */}
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getChannelColor(convo.channel)} flex items-center justify-center ring-2 ring-white`}>
                                    <Mail size={10} className="text-white" />
                                </div>
                            </div>

                            {/* Content */}
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

                            {/* Unread indicator */}
                            {convo.unread && (
                                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full flex-shrink-0" />
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
