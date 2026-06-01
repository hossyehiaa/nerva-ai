'use client';

import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  businesses?: Business[];
  _partial?: boolean;
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
  // Track whether we have an active session — protects against refreshUser()
  // nullifying the user during a temporary network/DB outage
  const hasSessionRef = useRef(false);

  const refreshUser = async () => {
    try {
      // Add timeout to prevent infinite loading on cold starts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/auth/me', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        hasSessionRef.current = true;
      } else if (res.status === 401) {
        // Only clear user on explicit authentication failure (invalid/expired token)
        setUser(null);
        hasSessionRef.current = false;
      }
      // For other errors (503, network, etc.), keep the existing user
    } catch {
      // Network error / timeout — don't clear user if we already have a session
      // This prevents cold-start DB outages from logging the user out
      if (!hasSessionRef.current) {
        setUser(null);
      }
      // If we DO have a session, keep the existing user — the error is temporary
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
        // Immediately set user from login response so the UI can redirect
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
        });
        setLoading(false);
        hasSessionRef.current = true;

        // After a short delay, try to refresh user data from DB
        // This gets the full user object including businesses
        // We do this in the background so it doesn't block the redirect
        setTimeout(() => {
          refreshUser().catch(() => {
            // Ignore errors — the user is already logged in from JWT
          });
        }, 500);

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
    hasSessionRef.current = false;
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
