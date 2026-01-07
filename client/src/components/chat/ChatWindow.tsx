
import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Zap, Paperclip, MoreHorizontal, ChevronDown, ChevronUp, Mail, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { format } from 'date-fns';

interface Message {
    id: string;
    content: string;
    senderType: 'AGENT' | 'CUSTOMER' | 'SYSTEM';
    createdAt: string;
    isInternal: boolean;
    senderId?: string;
}

interface CannedResponse {
    id: string;
    shortcut: string;
    content: string;
}

interface ChatWindowProps {
    conversationId: string;
    messages: Message[];
    onSendMessage: (content: string, type: 'AGENT' | 'SYSTEM', isInternal: boolean) => Promise<void>;
    recipientEmail?: string;
    recipientName?: string;
}

export function ChatWindow({ conversationId, messages, onSendMessage, recipientEmail, recipientName }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [input, setInput] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

    // Canned Responses
    const { token } = useAuth();
    const { currentAccount } = useAccount();
    const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
    const [showCanned, setShowCanned] = useState(false);
    const [cannedFilter, setCannedFilter] = useState('');

    // Fetch canned responses
    useEffect(() => {
        if (!currentAccount || !token) return;

        const fetchCanned = async () => {
            try {
                const res = await fetch('/api/chat/canned-responses', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-account-id': currentAccount.id
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCannedResponses(data);
                }
            } catch (e) {
                // Silently fail
            }
        };
        fetchCanned();
    }, [currentAccount, token]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, conversationId]);

    // Check for '/' trigger
    useEffect(() => {
        if (input.startsWith('/')) {
            setShowCanned(true);
            setCannedFilter(input.slice(1).toLowerCase());
        } else {
            setShowCanned(false);
            setCannedFilter('');
        }
    }, [input]);

    const filteredCanned = cannedResponses.filter(r =>
        r.shortcut.toLowerCase().includes(cannedFilter) ||
        r.content.toLowerCase().includes(cannedFilter)
    );

    const handleSelectCanned = (response: CannedResponse) => {
        setInput(response.content);
        setShowCanned(false);
        inputRef.current?.focus();
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(input, 'AGENT', isInternal);
            setInput('');
        } finally {
            setIsSending(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedMessages(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Parse email content (subject + body)
    const parseEmailContent = (content: string) => {
        if (content.startsWith('Subject:')) {
            const lines = content.split('\n');
            const subjectLine = lines[0].replace('Subject:', '').trim();
            const body = lines.slice(2).join('\n').trim();
            return { subject: subjectLine, body };
        }
        return { subject: null, body: content };
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Messages Area - Threaded Email View */}
            <div className="flex-1 overflow-y-auto">
                {messages.map((msg, idx) => {
                    const isMe = msg.senderType === 'AGENT';
                    const isSystem = msg.senderType === 'SYSTEM';
                    const isExpanded = expandedMessages.has(msg.id) || idx === messages.length - 1;
                    const { subject, body } = parseEmailContent(msg.content);

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center py-3 bg-gray-50 border-y border-gray-100">
                                <span className="text-gray-500 text-xs italic">
                                    {msg.content}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={cn(
                            "border-b border-gray-100",
                            msg.isInternal && "bg-yellow-50"
                        )}>
                            {/* Message Header */}
                            <div
                                className={cn(
                                    "flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                                    !isExpanded && "border-l-2 border-l-transparent hover:border-l-blue-400"
                                )}
                                onClick={() => toggleExpand(msg.id)}
                            >
                                {/* Avatar */}
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0",
                                    isMe ? "bg-blue-600" : "bg-gray-500"
                                )}>
                                    {isMe ? 'ME' : 'CU'}
                                </div>

                                {/* Header Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 text-sm">
                                                {isMe ? 'You' : (recipientName || recipientEmail || 'Customer')}
                                            </span>
                                            {msg.isInternal && (
                                                <span className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 text-[10px] font-medium rounded">
                                                    Private Note
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span>{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</span>
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </div>
                                    </div>

                                    {/* Subject or Preview */}
                                    {!isExpanded && (
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {subject || body.slice(0, 100)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pl-16">
                                    {subject && (
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Subject: {subject}
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {body}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Reply Composer - Chatwoot Style */}
            <div className="border-t border-gray-200 bg-white">
                {/* Canned Responses Dropdown */}
                {showCanned && filteredCanned.length > 0 && (
                    <div className="border-b border-gray-200 bg-white max-h-48 overflow-y-auto">
                        <div className="p-2 text-xs text-gray-500 border-b bg-gray-50">
                            Canned Responses (type to filter)
                        </div>
                        {filteredCanned.map(r => (
                            <button
                                key={r.id}
                                onClick={() => handleSelectCanned(r)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                                <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                    /{r.shortcut}
                                </span>
                                <p className="text-sm text-gray-700 mt-1 line-clamp-1">{r.content}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Reply Mode Toggle */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setIsInternal(false)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                            !isInternal
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Reply
                    </button>
                    <button
                        onClick={() => setIsInternal(true)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                            isInternal
                                ? "border-yellow-500 text-yellow-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Private Note
                    </button>
                </div>

                {/* To/CC Fields (for email replies) */}
                {!isInternal && recipientEmail && (
                    <div className="px-4 py-2 border-b border-gray-100 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 w-8">TO</span>
                            <span className="text-gray-700">{recipientEmail}</span>
                        </div>
                    </div>
                )}

                {/* Compose Area */}
                <div className={cn(
                    "p-4",
                    isInternal && "bg-yellow-50"
                )}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !showCanned) {
                                e.preventDefault();
                                handleSend();
                            }
                            if (e.key === 'Enter' && showCanned && filteredCanned.length > 0) {
                                e.preventDefault();
                                handleSelectCanned(filteredCanned[0]);
                            }
                            if (e.key === 'Escape' && showCanned) {
                                setShowCanned(false);
                                setInput('');
                            }
                        }}
                        placeholder={isInternal
                            ? "Add a private note (only visible to team)..."
                            : "Type your reply... (/ for canned responses)"}
                        className={cn(
                            "w-full min-h-[100px] resize-none border-none focus:ring-0 text-sm bg-transparent",
                            isInternal && "placeholder:text-yellow-600/50"
                        )}
                    />

                    {/* Toolbar */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setInput('/')}
                                className="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Canned Responses"
                            >
                                <Zap size={18} />
                            </button>
                            <button
                                type="button"
                                className="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Attach File"
                            >
                                <Paperclip size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isSending || showCanned}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                                isInternal
                                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                    : "bg-blue-600 text-white hover:bg-blue-700",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {isSending ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    Send
                                    <Send size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
