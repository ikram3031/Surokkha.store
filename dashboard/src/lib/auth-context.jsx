import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getGenericErrorMessage } from '@/lib/error-handler';
import { apiClient, baseURL, getApiBaseUrl } from '@/lib/api-client';

const AuthContext = createContext(undefined);

// Helper to check if a JWT token is expired (with 10-second safety buffer)
const isJwtExpired = (token) => {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed.exp) return false;
    return Date.now() >= parsed.exp * 1000 - 10000;
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (!storedUser || (!storedToken && !storedRefreshToken)) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          return;
        }

        // 1. If accessToken is still valid, authorize immediately
        if (storedToken && !isJwtExpired(storedToken)) {
          setUser(JSON.parse(storedUser));
          return;
        }

        // 2. If accessToken is expired, try to refresh BEFORE showing any dashboard content
        if (storedRefreshToken) {
          try {
            const res = await axios.post(`${getApiBaseUrl()}/api/v2/auth/refresh-token`, {
              refreshToken: storedRefreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = res.data?.data || {};
            if (accessToken) {
              localStorage.setItem('accessToken', accessToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }
              setUser(JSON.parse(storedUser));
              return;
            }
          } catch {
            // Refresh failed or refresh token expired
          }
        }

        // 3. If both accessToken and refreshToken are expired/invalid, clear session
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      } catch (e) {
        console.error('Failed to initialize auth session:', e);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Please provide both email and password.');
      }

      const response = await apiClient.post('/api/v1/auth/login', { email, password });
      
      // If 2FA is required, return this to the component to handle the second step
      if (response.data?.requires2fa) {
        return response.data;
      }

      const { user: apiUser, accessToken, refreshToken } = response.data.data;

      const loggedUser = {
        id: apiUser.id || apiUser._id,
        did: apiUser.did,
        email: apiUser.email || email,
        name: apiUser.name || email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: apiUser.role || "Employee",
        avatar: apiUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
    } catch (err) {
      throw new Error(getGenericErrorMessage(err, 'Sign in failed. Please check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const verify2fa = async (email, password, code) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/api/v1/auth/2fa/verify', { email, password, code });
      const { user: apiUser, accessToken, refreshToken } = response.data.data;

      const loggedUser = {
        id: apiUser.id || apiUser._id,
        did: apiUser.did,
        email: apiUser.email || email,
        name: apiUser.name || email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: apiUser.role || "Employee",
        avatar: apiUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
    } catch (err) {
      throw new Error(getGenericErrorMessage(err, '2FA verification failed. Please check the code.'));
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (code, redirectUri) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/api/v1/auth/google', { code, redirectUri });
      const { user: apiUser, accessToken, refreshToken } = response.data.data;

      const loggedUser = {
        id: apiUser.id || apiUser._id,
        did: apiUser.did,
        email: apiUser.email,
        name: apiUser.name,
        role: apiUser.role,
        avatar: apiUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
    } catch (err) {
      throw new Error(getGenericErrorMessage(err, 'Google Sign-in failed. Please verify your account.'));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/api/v1/auth/logout', { refreshToken }).catch(() => {});
      }
    } catch (_) {
      // ignore logout failure if offline
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, loginWithGoogle, verify2fa }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
