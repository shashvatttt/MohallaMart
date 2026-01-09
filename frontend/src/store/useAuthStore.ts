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
        localStorage.setItem('accessToken', userData.accessToken);
        localStorage.setItem('refreshToken', userData.refreshToken);
        set({ user: userData, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                // Optionally verify with backend '/me' endpoint
                const res = await api.get('/auth/me');
                set({ user: res.data, isAuthenticated: true, isLoading: false });
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } catch (error) {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    }
}));
