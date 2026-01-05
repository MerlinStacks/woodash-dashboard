
import { formatDistanceToNow } from 'date-fns';
import { User, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Conversation {
    id: string;
    wooCustomerId?: string;
    wooCustomer?: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    messages: { content: string, createdAt: string }[];
    updatedAt: string;
    status: string;
}

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-80">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Inbox</h2>
                <div className="flex gap-2 text-gray-500">
                    {/* Filter icons placeholder */}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No conversations found
                    </div>
                ) : (
                    conversations.map(conv => {
                        const lastMsg = conv.messages[0]?.content || 'No messages';
                        const name = conv.wooCustomer
                            ? `${conv.wooCustomer.firstName || ''} ${conv.wooCustomer.lastName || ''}`.trim() || conv.wooCustomer.email
                            : 'Visitor';

                        return (
                            <div
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={cn(
                                    "p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors",
                                    selectedId === conv.id ? "bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-gray-900 truncate">{name}</span>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{lastMsg}</p>

                                <div className="mt-2 flex gap-2">
                                    {conv.status === 'OPEN' && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Open</span>}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
