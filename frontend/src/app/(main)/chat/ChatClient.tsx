"use client";


import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDistanceToNow } from "date-fns";

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
    getMessages,
    addMessage,
  } = useChatStore();

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !socket) {
      connectSocket(user._id);
    }
    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser, getMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user || !socket) return;

    const content = newMessage;
    setNewMessage("");

    socket.emit("sendMessage", {
      senderId: user._id,
      receiverId: selectedUser._id,
      content,
    });

    addMessage({
      _id: Date.now().toString(),
      sender: { _id: user._id, name: user.name },
      receiver: { _id: selectedUser._id, name: selectedUser.name },
      content,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white border rounded-lg overflow-hidden">
      <div className="w-1/3 border-r p-4">
        {conversations.map((c) => (
          <div
            key={c._id}
            onClick={() => setSelectedUser(c)}
            className="cursor-pointer p-2 hover:bg-gray-100"
          >
            {c.name}
          </div>
        ))}
      </div>

      <div className="w-2/3 flex flex-col">
        {selectedUser ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className="mb-2">
                  <p>{m.content}</p>
                  <small className="text-gray-400">
                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                  </small>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <Button type="submit">Send</Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a chat
          </div>
        )}
      </div>
    </div>
  );
}
