"use client";

import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { api } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  plan_expires_at: string | null;
  avatar_url?: string;
  email_verified: boolean;
  certificates_this_month: number;
  last_usage_reset: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getCurrentUser();
      setUser(response.data.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await refreshUser();
    };
    init();
  }, [refreshUser]);

  const login = useCallback(async (data: any) => {
    const response = await api.login(data);
    setUser(response.data.data);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const register = useCallback(
    async (data: any) => {
      const response = await api.register(data);
      setUser(response.data.data);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
