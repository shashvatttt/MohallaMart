
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function ChatParamsHandler() {
    const searchParams = useSearchParams();
    const initUserId = searchParams.get("userId");

    const { user } = useAuthStore();
    const { conversations, setSelectedUser } = useChatStore();

    useEffect(() => {
        if (initUserId && user && initUserId !== user._id) {
            const existing = conversations.find((c) => c._id === initUserId);
            if (existing) {
                setSelectedUser(existing);
            } else {
                setSelectedUser({ _id: initUserId, name: "User" });
            }
        }
    }, [initUserId, user, conversations, setSelectedUser]);

    return null;
}
