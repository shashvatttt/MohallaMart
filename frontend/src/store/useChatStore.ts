import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import api from '@/services/api';

interface Message {
    _id: string;
    sender: { _id: string; name: string };
    receiver: { _id: string; name: string };
    content: string;
    createdAt: string;
    tempId?: string; // For deduplication
}

interface Conversation {
    _id: string;
    name: string;
    email?: string;
    unreadCount?: number;
    lastMessage?: {
        content: string;
        createdAt: string;
        sender: string; // ID only
    };
}

interface ChatState {
    socket: Socket | null;
    messages: Message[];
    conversations: Conversation[];
    selectedUser: any | null;
    onlineUsers: string[];
    isConnecting: boolean;
    unreadCount: number;

    // Actions
    connectSocket: (userId: string) => void;
    disconnectSocket: () => void;
    resetUnreadCount: () => void;
    getConversations: () => Promise<void>;
    getMessages: (userId: string) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    sendMessage: (content: string, receiverId: string, senderId: string) => void;
    setSelectedUser: (user: any) => void;
    addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    socket: null,
    messages: [],
    conversations: [],
    selectedUser: null,
    onlineUsers: [],
    isConnecting: false,
    unreadCount: 0,
    // Reset unread count (e.g., when user opens chat page)
    resetUnreadCount: () => set({ unreadCount: 0 }),

    connectSocket: (userId) => {
        const { socket, isConnecting } = get();
        // Ensure we disconnect existing socket if user is different or just to be safe
        if (socket) {
            if (socket.connected) {
                // If it's the same user, we might not need to reconnect, but let's be safe for now
                // socket.disconnect(); 
            }
        }

        set({ isConnecting: true });

        // Robust URL construction
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
        console.log(`Connecting to socket at: ${baseUrl} for user: ${userId}`);

        const newSocket = io(baseUrl, {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling'] // Force websocket first but allow polling
        });

        newSocket.on('connect', () => {
            console.log("Socket connected successfully:", newSocket.id);
            newSocket.emit('join', userId);
            set({ isConnecting: false });
        });

        newSocket.on('receiveMessage', (message: Message) => {
            const { selectedUser, messages, getConversations, unreadCount } = get();

            // If viewing chat with sender OR receiver (me), append message
            const isRelevant = selectedUser &&
                (message.sender._id.toString() === selectedUser._id.toString() ||
                    message.receiver._id.toString() === selectedUser._id.toString());

            if (isRelevant) {
                // Check if message already exists (e.g. from optimistic update)
                // We use tempId if available, OR fall back to exact content/time match
                const exists = messages.some(m =>
                    (message.tempId && m.tempId === message.tempId) ||
                    (m._id === message._id)
                );

                if (exists) {
                    // Update the optimistic message with the real one from DB (to get the real _id)
                    set({
                        messages: messages.map(m =>
                            (message.tempId && m.tempId === message.tempId) || (m._id === message._id)
                                ? message
                                : m
                        )
                    });
                } else {
                    set({ messages: [...messages, message] });
                }
            } else {
                // Increment unread count for messages not in current chat
                // Also update the specific conversation's unread count
                set(state => ({
                    unreadCount: state.unreadCount + 1,
                    conversations: state.conversations.map(c =>
                        c._id === message.sender._id
                            ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: { content: message.content, createdAt: message.createdAt, sender: message.sender._id } }
                            : c
                    )
                }));
            }

            // Refresh conversations list to update previews
            getConversations();
        });

        newSocket.on('messageError', (data: { error: string }) => {
            console.error("Message send error:", data.error);
            // Optionally, we could remove the optimistic message here if we had a way to identify it
        });

        // Handle connection errors
        newSocket.on('connect_error', (err) => {
            console.error("Socket connection error details:", err.message);
            set({ isConnecting: false });
        });

        set({ socket: newSocket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnecting: false });
        }
    },

    getConversations: async () => {
        try {
            const res = await api.get('/chat/conversations');
            set({ conversations: res.data });
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        }
    },
    fetchUnreadCount: async () => {
        try {
            const res = await api.get('/chat/unread-count');
            set({ unreadCount: res.data.count });
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    },
    getMessages: async (userId) => {
        if (!userId) return;
        try {
            const res = await api.get(`/chat/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    },

    sendMessage: (content, receiverId, senderId) => {
        const { socket, selectedUser, messages } = get();
        if (socket) {
            // Optimistic Update
            const tempId = `temp-${Date.now()}`;
            const optimisticMessage: Message = {
                _id: tempId, // Use tempId as _id initially
                sender: { _id: senderId, name: 'Me' }, // Name will be updated on sync
                receiver: { _id: receiverId, name: selectedUser?.name || 'User' },
                content,
                createdAt: new Date().toISOString(),
                tempId
            };

            if (selectedUser && selectedUser._id === receiverId) {
                set({ messages: [...messages, optimisticMessage] });
            }

            socket.emit("sendMessage", {
                senderId,
                receiverId,
                content,
                tempId
            });
        }
    },

    setSelectedUser: (user) => {
        set({ selectedUser: user });
        if (user) {
            get().getMessages(user._id);
        } else {
            set({ messages: [] });
        }
    },

    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));
