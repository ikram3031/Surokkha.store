import axios from 'axios';
import { handleGlobalError } from './error-handler';
import clientConfig from '@/clientConfig';

// Dynamically determines active API Base URL from hostname or clientConfig for Admin Dashboard
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('surokkha')) {
      return 'https://service.surokkha.store';
    }
    if (host.includes('engulfic')) {
      return 'https://service.engulfic.com';
    }
    if (host.includes('decantre')) {
      return 'https://service.decantrebd.com';
    }
  }
  return (
    import.meta.env.VITE_SERVICE_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    clientConfig?.dashboardApiUrl ||
    clientConfig?.serviceApiBaseUrl ||
    clientConfig?.apiBaseUrl ||
    'https://service.surokkha.store'
  );
};

// Dynamically determines active Storefront API Base URL for public customer interactions
export const getStorefrontApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('surokkha')) {
      return 'https://server.surokkha.store';
    }
    if (host.includes('engulfic')) {
      return 'https://server.engulfic.com';
    }
    if (host.includes('decantre')) {
      return 'https://server.decantrebd.com';
    }
  }
  return (
    import.meta.env.VITE_STOREFRONT_API_BASE_URL ||
    clientConfig?.storefrontApiUrl ||
    clientConfig?.apiBaseUrl ||
    'https://server.surokkha.store'
  );
};

// Dynamically determines active WebSocket URL for real-time notifications
export const getWebSocketUrl = () => {
  const apiBase = getApiBaseUrl();
  try {
    const url = new URL(apiBase);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws`;
  } catch (_) {
    return 'wss://service.decantrebd.com/ws';
  }
};

export const baseURL = getApiBaseUrl();

// Resolves media asset paths to absolute URLs matching active Dev or Live environment endpoints
export const resolveImageUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw;

  const currentBase = getApiBaseUrl().replace(/\/$/, '');

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const urlObj = new URL(raw);
      const isRawLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
      const isBaseLocalhost = currentBase.includes('localhost') || currentBase.includes('127.0.0.1');

      if (isBaseLocalhost && !isRawLocalhost && urlObj.pathname.startsWith('/uploads')) {
        return `${currentBase}${urlObj.pathname}${urlObj.search}`;
      } else if (!isBaseLocalhost && isRawLocalhost && urlObj.pathname.startsWith('/uploads')) {
        return `${currentBase}${urlObj.pathname}${urlObj.search}`;
      }
    } catch (_) {}
    return raw;
  }

  return `${currentBase}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Ensure dynamic baseURL, route to /api/v2/, and attach Bearer Token if available
apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  if (config.url && config.url.startsWith('/api/v1/')) {
    config.url = config.url.replace(/^\/api\/v1\//, '/api/v2/');
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle 401 Unauthorized & Token Refresh logic with queuing
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh-token') ||
      requestUrl.includes('/api/v1/auth/login') ||
      requestUrl.includes('/api/v1/auth/refresh-token') ||
      requestUrl.includes('/api/v2/auth/login') ||
      requestUrl.includes('/api/v2/auth/refresh-token');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (typeof window === 'undefined') throw new Error('Not running in client-side');

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('Session expired. Please sign in again.');

        const res = await axios.post(`${getApiBaseUrl()}/api/v2/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (typeof window !== 'undefined' && !isAuthRequest) {
      handleGlobalError(error);
    }
    return Promise.reject(error);
  }
);
