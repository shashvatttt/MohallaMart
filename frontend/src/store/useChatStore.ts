import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import api from '@/services/api';

interface Message {
    _id: string;
    sender: { _id: string; name: string };
    receiver: { _id: string; name: string };
    content: string;
    createdAt: string;
}

interface ChatState {
    socket: Socket | null;
    messages: Message[];
    conversations: any[];
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
        if (socket?.connected || isConnecting) return;

        set({ isConnecting: true });

        const newSocket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001', {
            withCredentials: true,
            reconnection: true,
        });

        newSocket.on('connect', () => {
            console.log("Socket connected");
            newSocket.emit('join', userId);
            set({ isConnecting: false });
        });

        newSocket.on('receiveMessage', (message: Message) => {
            const { selectedUser, messages, getConversations, unreadCount } = get();

            // If viewing chat with sender OR receiver (me), append message
            const isRelevant = selectedUser &&
                (message.sender._id === selectedUser._id || message.receiver._id === selectedUser._id);

            if (isRelevant) {
                const exists = messages.some(m => m._id === message._id);
                if (!exists) {
                    set({ messages: [...messages, message] });
                }
            } else {
                // Increment unread count for messages not in current chat
                set({ unreadCount: unreadCount + 1 });
            }

            // Refresh conversations list to update previews
            getConversations();
        });
        // Handle connection errors
        newSocket.on('connect_error', (err) => {
            console.error("Socket connection error:", err);
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
        const { socket } = get();
        if (socket) {
            socket.emit("sendMessage", {
                senderId,
                receiverId,
                content
            });
            // We rely on the socket "receiveMessage" event to update the UI even for our own messages
            // This ensures state consistency. 
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
