
import { useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

/**
 * Headless component to handle global chat notifications via browser API
 */
export function ChatNotifications() {
    const { socket } = useSocket();
    const { user } = useAuth();
    const location = useLocation();

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
            const isAssignedToMe = true; // TODO: Check if assigned to current user? For now notify all agents.

            // Logic: Notify if it's a customer message.
            if (isCustomerMessage) {
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

        socket.on('message:new', handleNewMessage);

        return () => {
            socket.off('message:new', handleNewMessage);
        };
    }, [socket, location.pathname, user]);

    return null; // Headless
}
