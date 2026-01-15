"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

export default function ChatClient() {
  const { user } = useAuthStore();
  const {
    socket,
    connectSocket,
    disconnectSocket,
    conversations,
    getConversations,
    selectedUser,
    setSelectedUser,
    messages,
    sendMessage,
    isConnecting
  } = useChatStore();

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Connect socket on mount
  useEffect(() => {
    if (user && !socket && !isConnecting) {
      connectSocket(user._id);
    }
    // Cleanup on unmount is handled by the store or we can do it here if we want strict per-page connections
    // For a single page app feel, we might want to keep it global, but for this component:
    return () => {
      // Optional: disconnectSocket(); // keeping logic in store to manage disconnects
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch conversations on mount
  useEffect(() => {
    getConversations();
  }, [getConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user) return;

    sendMessage(newMessage, selectedUser._id, user._id);
    setNewMessage("");
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-6xl mx-auto my-4">
      {/* Sidebar - Users List */}
      <div className="w-full md:w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Messages</h2>
          <div className="relative">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((c) => (
              <div
                key={c._id}
                onClick={() => setSelectedUser(c)}
                className={`cursor-pointer p-4 flex items-center space-x-3 hover:bg-white transition-colors border-b border-gray-100 ${selectedUser?._id === c._id ? "bg-white border-l-4 border-l-blue-500 shadow-sm" : ""
                  }`}
              >
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Online status indicator can go here */}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-sm truncate ${c.unreadCount && c.unreadCount > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>{c.name}</h3>
                    {c.lastMessage && (
                      <span className="text-[10px] text-gray-400">
                        {formatDistanceToNow(new Date(c.lastMessage.createdAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate max-w-[120px] ${c.unreadCount && c.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                      {c.lastMessage
                        ? (c.lastMessage.sender === user?._id ? `You: ${c.lastMessage.content}` : c.lastMessage.content)
                        : 'Click to chat'}
                    </p>
                    {c.unreadCount && c.unreadCount > 0 ? (
                      <span className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shimmer-effect">
                        {c.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white w-full md:w-2/3">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-white shadow-sm z-10">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{selectedUser.name}</h3>
                <span className="text-xs text-green-500 font-medium">Online</span>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <p>No messages yet.</p>
                  <p className="text-sm">Say hello!</p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isMe = m.sender._id === user?._id;
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMe
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                          }`}
                      >
                        <p className="text-sm">{m.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message..."
                  className="rounded-full border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  autoFocus
                />
                <Button
                  type="submit"
                  className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 transition-all font-semibold"
                  disabled={!newMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
            <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700">Your Messages</h3>
            <p className="text-sm mt-2">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
