"use client";

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { LogOut, Home, MessageCircle, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useChatStore } from '@/store/useChatStore';

export default function Navbar() {
    const { user, logout, isAuthenticated, checkAuth } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const unreadCount = useChatStore(state => state.unreadCount);
    const fetchUnread = useChatStore(state => state.fetchUnreadCount);
    const resetUnread = useChatStore(state => state.resetUnreadCount);

    useEffect(() => {
        setMounted(true);
        checkAuth();
        fetchUnread();
    }, [checkAuth, fetchUnread]);

    const handleChatClick = () => {
        resetUnread();
    };

    if (!mounted) return null;

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-indigo-600">MohallaMart</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link href="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </Link>
                            <Link href="/communities" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                                <UserIcon className="w-4 h-4 mr-2" />
                                Communities
                            </Link>
                            <Link href="/chat" onClick={handleChatClick} className="relative inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Chat
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <span className="text-sm text-gray-700 hidden md:block">
                                    Hello, {user?.name}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        logout();
                                        window.location.href = '/login';
                                    }}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">Log in</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button size="sm">Sign up</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
