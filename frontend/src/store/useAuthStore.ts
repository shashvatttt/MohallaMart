import { create } from 'zustand';
import api from '@/services/api';

interface User {
    _id: string;
    name: string;
    email: string;
    joinedCommunities: string[];
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: any) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading true to check auth on mount

    login: (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        // Cookies are set by server
        set({ user: userData, isAuthenticated: true });
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error', error);
        }
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        try {
            // Simply call /me. Middleware will check cookies.
            const res = await api.get('/auth/me');
            set({ user: res.data, isAuthenticated: true, isLoading: false });
            localStorage.setItem('user', JSON.stringify(res.data));
        } catch (error) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            localStorage.removeItem('user');
        }
    }
}));
