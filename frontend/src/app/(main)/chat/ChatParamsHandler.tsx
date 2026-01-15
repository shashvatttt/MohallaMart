

"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function ChatParamsHandler() {
    const { user } = useAuthStore();
    const { conversations, setSelectedUser, selectedUser } = useChatStore();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const initUserId = params.get("userId");

            if (initUserId && user && initUserId !== user._id) {
                // Only set if not already selected to avoid infinite fetch loops or redundant refreshes
                if (selectedUser?._id !== initUserId) {
                    const existing = conversations.find((c) => c._id === initUserId);
                    if (existing) {
                        setSelectedUser(existing);
                    } else if (conversations.length > 0 || initUserId) {
                        // If conversations loaded but user not found, or it's a first-time message
                        setSelectedUser({ _id: initUserId, name: "User" });
                    }
                }
            }
        }
    }, [user, conversations, setSelectedUser, selectedUser]);

    return null;
}
