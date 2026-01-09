

"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function ChatParamsHandler() {
    const { user } = useAuthStore();
    const { conversations, setSelectedUser } = useChatStore();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const initUserId = params.get("userId");

            if (initUserId && user && initUserId !== user._id) {
                const existing = conversations.find((c) => c._id === initUserId);
                if (existing) {
                    setSelectedUser(existing);
                } else {
                    setSelectedUser({ _id: initUserId, name: "User" });
                }
            }
        }
    }, [user, conversations, setSelectedUser]);

    return null;
}
