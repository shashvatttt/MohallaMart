import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Request interceptor not needed as cookies are sent automatically with `withCredentials: true`

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Call refresh endpoint - cookie will be sent automatically
                const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
                if (res.status === 200) {
                    // Refresh successful, cookies updated by server response
                    // Retry original request
                    return api(originalRequest);
                }
            } catch (err) {
                // Refresh failed
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('user'); // Keep user data sync clear
                    window.location.href = '/login';
                }
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
