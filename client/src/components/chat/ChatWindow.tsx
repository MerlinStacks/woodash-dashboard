
import { useState, useEffect, useRef } from 'react';
import { Send, FileText, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

interface Message {
    id: string;
    content: string;
    senderType: 'AGENT' | 'CUSTOMER' | 'SYSTEM';
    createdAt: string;
    isInternal: boolean;
    senderId?: string;
}

interface ChatWindowProps {
    conversationId: string;
    messages: Message[];
    onSendMessage: (content: string, type: 'AGENT' | 'SYSTEM', isInternal: boolean) => Promise<void>;
}

export function ChatWindow({ conversationId, messages, onSendMessage }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, conversationId]);

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

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header placeholder - could show customer online status */}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => {
                    const isMe = msg.senderType === 'AGENT'; // Simplified for now
                    const isSystem = msg.senderType === 'SYSTEM';

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-4">
                                <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                    {msg.content}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={cn(
                            "flex w-full",
                            isMe ? "justify-end" : "justify-start"
                        )}>
                            <div className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                                isMe && !msg.isInternal ? "bg-blue-600 text-white rounded-br-none" : "",
                                !isMe ? "bg-white text-gray-800 border border-gray-100 rounded-bl-none" : "",
                                msg.isInternal ? "bg-yellow-100 text-yellow-900 border border-yellow-200" : ""
                            )}>
                                {msg.isInternal && <div className="text-xs font-bold mb-1 opacity-70">Internal Note</div>}
                                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                <div className={cn(
                                    "text-[10px] mt-1 text-right",
                                    isMe ? "text-blue-100" : "text-gray-400"
                                )}>
                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSend} className="relative">
                    <div className="flex gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => setIsInternal(!isInternal)}
                            className={cn(
                                "text-xs font-medium px-2 py-1 rounded transition-colors",
                                isInternal ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                        >
                            {isInternal ? 'Note (Internal)' : 'Reply (Public)'}
                        </button>
                    </div>

                    <div className={cn(
                        "flex items-end gap-2 border rounded-xl p-2 focus-within:ring-2 transition-all",
                        isInternal ? "border-yellow-300 focus-within:ring-yellow-200 bg-yellow-50" : "border-gray-300 focus-within:ring-blue-100 bg-white"
                    )}>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={isInternal ? "Write a private note..." : "Type a message..."}
                            className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent border-none focus:ring-0 text-sm py-2"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isSending}
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                isInternal
                                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                    : "bg-blue-600 text-white hover:bg-blue-700",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
