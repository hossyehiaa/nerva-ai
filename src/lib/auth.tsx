'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  businesses?: Business[];
}

interface Business {
  id: string;
  name: string;
  industry: string;
  contextData: string;
  systemPrompt: string;
  apiKey: string;
  subscriptionStatus: string;
  leadLimit: number;
  createdAt: string;
  agents?: Agent[];
  _count?: { leads: number };
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  config: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      // Add timeout to prevent infinite loading on cold starts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('/api/auth/me', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (res.ok) {
        // Wait a tick for cookie to be set, then refresh user
        await new Promise(resolve => setTimeout(resolve, 200));
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      console.error('Login fetch error:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { success: false, error: 'Request timed out. Please try again.' };
      }
      return { success: false, error: 'Network error. Please check your connection and try again.' };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (res.ok) {
        // Auto-login after registration
        return await login(email, password);
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (error) {
      console.error('Register fetch error:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { success: false, error: 'Request timed out. Please try again.' };
      }
      return { success: false, error: 'Network error. Please check your connection and try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
