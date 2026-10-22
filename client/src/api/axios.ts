import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Extend Axios config to track retry state
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const axiosInstance = axios.create({
  baseURL: '',
  withCredentials: true, // Sends and receives HttpOnly cookies (access_token, refresh_token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag and pending promise queue to prevent simultaneous refresh requests (thundering herd)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response Interceptor: Silent automatic token refresh on 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; message?: string; details?: Array<{ field: string; message: string }> }>) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Do not attempt refresh on auth endpoints (login, register, refresh itself)
    const isAuthEndpoint =
      originalRequest?.url?.includes('/api/auth/login') ||
      originalRequest?.url?.includes('/api/auth/register') ||
      originalRequest?.url?.includes('/api/auth/refresh') ||
      originalRequest?.url?.includes('/api/auth/logout');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // If a refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent rotation via HttpOnly refresh cookie
        await axiosInstance.post('/api/auth/refresh');
        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError);
        // When the refresh token itself is expired or revoked, session is dead.
        // Notify the application so UI instantly transitions to the sign-in enclave.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
