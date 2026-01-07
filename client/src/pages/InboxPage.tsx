
import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useAccount } from '../context/AccountContext';
import { ConversationList } from '../components/chat/ConversationList';
import { ChatWindow } from '../components/chat/ChatWindow';

export function InboxPage() {
    const { socket, isConnected } = useSocket();
    const { token } = useAuth();
    const { currentAccount } = useAccount();

    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const activeConversation = conversations.find(c => c.id === selectedId);

    // Initial Load
    useEffect(() => {
        if (!currentAccount || !token) return;

        const fetchConversations = async () => {
            try {
                const res = await fetch('/api/chat/conversations', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-account-id': currentAccount.id
                    }
                });
                const data = await res.json();
                setConversations(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load chats', error);
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [currentAccount, token]);

    // Socket Listeners
    useEffect(() => {
        if (!socket || !currentAccount || !token) return;

        // Listen for list updates
        socket.on('conversation:updated', async (data: any) => {
            setConversations(prev => {
                const idx = prev.findIndex(c => c.id === data.id);
                if (idx === -1) {
                    // New conversation - fetch it and prepend
                    // We'll do this asynchronously and update state when done
                    fetchNewConversation(data.id);
                    return prev;
                }
                const updated = [...prev];
                updated[idx] = {
                    ...updated[idx],
                    messages: [data.lastMessage],
                    updatedAt: data.updatedAt
                };
                // Re-sort
                return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            });

            // If this is the active conversation, append message
            if (selectedId === data.id && data.lastMessage) {
                setMessages(prev => {
                    if (prev.find(m => m.id === data.lastMessage.id)) return prev;
                    return [...prev, data.lastMessage];
                });
            }
        });

        socket.on('message:new', (msg: any) => {
            // Only append if it's the current one
            if (selectedId === msg.conversationId) {
                setMessages(prev => [...prev, msg]);
            }
        });

        // Helper to fetch a new conversation by ID and add it to the list
        const fetchNewConversation = async (id: string) => {
            try {
                const res = await fetch(`/api/chat/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const newConv = await res.json();
                    setConversations(prev => {
                        // Check if it was added while we were fetching
                        if (prev.find(c => c.id === id)) return prev;
                        return [newConv, ...prev];
                    });
                }
            } catch (error) {
                console.error('Failed to fetch new conversation', error);
            }
        };

        return () => {
            socket.off('conversation:updated');
            socket.off('message:new');
        };
    }, [socket, selectedId, currentAccount, token]);


    // Fetch Messages when selected
    useEffect(() => {
        if (!selectedId || !token) return;

        // Join room
        socket?.emit('join:conversation', selectedId);

        const fetchMessages = async () => {
            const res = await fetch(`/api/chat/${selectedId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.messages) setMessages(data.messages);
        };
        fetchMessages();

        return () => {
            socket?.emit('leave:conversation', selectedId);
        };
    }, [selectedId, token, socket]);

    const handleSendMessage = async (content: string, type: 'AGENT' | 'SYSTEM', isInternal: boolean) => {
        if (!selectedId) return;

        // Optimistic UI could be added here

        const res = await fetch(`/api/chat/${selectedId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content, type, isInternal })
        });

        if (!res.ok) {
            alert('Failed to send'); // Simple error handling
        }

        // Socket should handle the update in UI
    };

    if (isLoading) return <div className="h-full flex items-center justify-center">Loading inbox...</div>;

    return (
        <div className="h-[calc(100vh-64px)] flex bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <ConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={setSelectedId}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {selectedId ? (
                    <ChatWindow
                        conversationId={selectedId}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Select a conversation
                    </div>
                )}
            </div>

            {/* Right Sidebar (Details) Placeholder */}
            {selectedId && (
                <div className="w-72 border-l border-gray-200 bg-gray-50 p-4 hidden lg:block">
                    <h3 className="font-semibold text-gray-700 mb-4">Details</h3>
                    <div className="text-sm text-gray-500">
                        {activeConversation?.wooCustomer ? (
                            <>
                                <p className="font-medium text-gray-900">{activeConversation.wooCustomer.firstName} {activeConversation.wooCustomer.lastName}</p>
                                <p>{activeConversation.wooCustomer.email}</p>
                            </>
                        ) : (
                            <p>Anonymous Visitor</p>
                        )}
                        <div className="mt-4">
                            <button className="text-blue-600 hover:underline">Link Customer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
