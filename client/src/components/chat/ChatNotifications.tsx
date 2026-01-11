
import { useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Headless component to handle global chat notifications via browser API
 */
export function ChatNotifications() {
    const { socket } = useSocket();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Check permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: any) => {
            // Don't notify for our own messages
            // Assuming msg.senderId or similar exists. Inspecting InboxPage types implies `msg` object usage.
            // If msg.isInternal is true, it might be from an agent (us) or another agent.
            // Best check: if the message type is AGENT and we are the one sending it, skip.
            // But usually, we only get notified of *incoming* things or other people's actions.
            // Let's assume we want to know about CUSTOMER messages primarily, or system alerts.

            // If it's an outbound message from us, ignore
            // Using a simple logic: If type is 'CUSTOMER', always notify.
            // If type is 'AGENT' and it's NOT us, notify (collaboration).

            // NOTE: We rely on the message structure from the socket event.
            // Based on typical schema: { content, type, senderId, conversationId, ... }

            // Simplification: Notify for everything that isn't explicitly flagged as 'from me' 
            // The socket msg might not have `isMe` flag unless we process it. 
            // Let's assume we want to notify for Customer messages.

            const isCustomerMessage = msg.type === 'CUSTOMER' || msg.senderType === 'CUSTOMER';
            // Only notify if message is assigned to current user, or unassigned (notify all)
            const isAssignedToMe = !msg.assignedTo || msg.assignedTo === user?.id;

            // Logic: Notify if it's a customer message AND (assigned to me OR unassigned)
            if (isCustomerMessage && isAssignedToMe) {
                // If we are currently ON the inbox page AND looking at this specific conversation, maybe don't notify?
                // Or simply always notify if window is blurred? 
                // Let's rely on standard browser behavior (sometimes they mute notification if focused).
                // But generally users like a 'ding' even if open.

                // However, if we are active on that specific chat, it might be annoying.
                // InboxPage route is usually /inbox. 
                const isOnInbox = location.pathname.startsWith('/inbox');
                // We don't easily know the "active" conversation ID here without accessing InboxPage state.
                // But generally, a notification is safe.

                if (Notification.permission === 'granted') {
                    const n = new Notification('New Message', {
                        body: msg.content || 'You have a new message',
                        icon: '/favicon.ico', // Fallback or app icon
                        tag: `conversation-${msg.conversationId}` // Group by notification tag to avoid spam
                    });

                    n.onclick = function () {
                        window.focus();
                        // Ideally navigate to specific conversation:
                        // window.location.href = `/inbox?conversationId=${msg.conversationId}`; 
                        // But SPA navigation is better if we can hook into router, 
                        // but window.location is safe for focusing.
                    };
                }
            }
        };

        /**
         * Handle snooze expiry notifications.
         * When a snoozed conversation reopens, notify the assigned agent.
         */
        const handleSnoozeExpired = (data: {
            conversationId: string;
            assignedToId?: string;
            customerName?: string;
        }) => {
            // Only notify if this conversation is assigned to the current user
            if (data.assignedToId && data.assignedToId !== user?.id) {
                return;
            }

            if (Notification.permission === 'granted') {
                const customerName = data.customerName || 'Customer';
                const n = new Notification('⏰ Snooze Ended', {
                    body: `Conversation with ${customerName} has reopened`,
                    icon: '/favicon.ico',
                    tag: `snooze-${data.conversationId}`,
                    requireInteraction: true, // Keep notification until user interacts
                });

                n.onclick = function () {
                    window.focus();
                    // Navigate to the conversation
                    navigate(`/inbox?conversationId=${data.conversationId}`);
                    n.close();
                };
            }
        };

        socket.on('message:new', handleNewMessage);
        socket.on('snooze:expired', handleSnoozeExpired);

        return () => {
            socket.off('message:new', handleNewMessage);
            socket.off('snooze:expired', handleSnoozeExpired);
        };
    }, [socket, location.pathname, user, navigate]);

    return null; // Headless
}
