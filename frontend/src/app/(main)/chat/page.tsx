"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
    const { user } = useAuthStore();
    const {
        socket, connectSocket, disconnectSocket,
        conversations, getConversations,
        selectedUser, setSelectedUser,
        messages, getMessages, addMessage
    } = useChatStore();

    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const initUserId = searchParams.get('userId');

    useEffect(() => {
        if (user && !socket) {
            connectSocket(user._id);
        }
        return () => {
            // We only disconnect if we are unmounting or user changes significantly.
            // Actually, checking if socket exists inside here is better to avoid stale closure if we wanted to be 100% clean, 
            // but calling disconnectSocket() from store is safe.
            disconnectSocket();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        getConversations();
    }, [getConversations]);

    useEffect(() => {
        const initChat = async () => {
            if (initUserId && user) {
                if (initUserId === user._id) return;
                // Fetch user details if not in conversations
                try {
                    // We don't have a distinct "get user by id" public endpoint easily accessible without auth or just assume we have basic info.
                    // But we can check if it's in conversations.
                    const existing = conversations.find(c => c._id === initUserId);
                    if (existing) {
                        setSelectedUser(existing);
                    } else {
                        // Need to start fresh chat. Just set a dummy selected user or fetch.
                        // Let's fetch products details again? No.
                        // Ideally we have an endpoint GET /users/:id. 
                        // Check if we can use getConversations logic.
                        // For MVP, if not in conversation, we might show "Loading user..." or handle it.
                        // Let's create a temporary object if we assume the name isn't critical immediately or fix backend.
                        // Actually, we can assume the user clicked "Chat with Seller" so they know who it is.
                        // We will implement a quick fetch if needed, but for now let's just wait for user to send message.
                        // Or, update backend to allow fetching basic public profile.

                        // Workaround: We will just set ID and handle name display gracefully or fetch from product if we came from there context (but we lost it).
                        // Let's fetch basic info via a new utility or just assume it works.

                        // Actually, I can use the existing /products/:id to get seller info if I knew the product, but I don't.
                        // I added /api/auth/me, maybe I need /api/users/:id?
                        // Let's just handle it by creating a temporary user object with ID.
                        setSelectedUser({ _id: initUserId, name: 'User' });
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        };
        initChat();
    }, [initUserId, user, conversations, setSelectedUser]);

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
        }
    }, [selectedUser, getMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !user || !socket) return;

        const content = newMessage;
        setNewMessage('');

        // Emit via socket
        socket.emit('sendMessage', {
            senderId: user._id,
            receiverId: selectedUser._id,
            content
        });

        // Optimistically add to UI
        const msg = {
            _id: Date.now().toString(), // temp id
            sender: { _id: user._id, name: user.name },
            receiver: { _id: selectedUser._id, name: selectedUser.name },
            content,
            createdAt: new Date().toISOString()
        };
        addMessage(msg);

        // Refresh conversations if it's a new one
        if (!conversations.find(c => c._id === selectedUser._id)) {
            getConversations();
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Sidebar */}
            <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-gray-700">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <p className="p-4 text-gray-500 text-sm text-center">No conversations yet.</p>
                    ) : (
                        conversations.map((c) => (
                            <div
                                key={c._id}
                                onClick={() => setSelectedUser(c)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedUser?._id === c._id ? 'bg-indigo-50' : ''}`}
                            >
                                <div className="font-medium text-gray-900">{c.name}</div>
                                <div className="text-xs text-gray-500 truncate">{c.email}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`w-full md:w-2/3 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                {selectedUser ? (
                    <>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedUser(null)}>
                                Back
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {messages.map((m, idx) => {
                                const isMe = m.sender._id === user?._id;
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-900'
                                            }`}>
                                            <p>{m.content}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1"
                            />
                            <Button type="submit" disabled={!newMessage.trim()}>
                                Send
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50/30">
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
