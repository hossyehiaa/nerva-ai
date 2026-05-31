'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      // Check if user is admin by calling /api/auth/me
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const user = await res.json();
          if (user.role === 'admin') {
            window.location.href = '/admin';
            return;
          } else {
            setError('Access denied. Admin privileges required.');
            await fetch('/api/auth/logout', { method: 'POST' });
          }
        }
      } catch {
        setError('Authentication error. Please try again.');
      }
    } else {
      setError(result.error || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#0a0f1e] to-[#030712] flex items-center justify-center px-4">
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center mx-auto mb-4 shadow-lg shadow-nerva-cyan/20">
            <Zap className="w-8 h-8 text-nerva-dark" />
          </div>
          <h1 className="text-2xl font-bold mb-1">
            <span className="gradient-text-cyan">Nerva</span>
            <span className="text-foreground ml-1">Admin</span>
          </h1>
          <p className="text-sm text-muted-foreground">Authorized personnel only</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold">Admin Login</h2>
              <p className="text-xs text-muted-foreground">Secure access to management panel</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nerva.ai"
                className="bg-muted/50 border-nerva-border h-11 rounded-xl"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="bg-muted/50 border-nerva-border h-11 rounded-xl"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              disabled={!email || !password || loading}
              className="w-full shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold rounded-xl h-11"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Signing in...' : 'Sign In to Admin'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-muted-foreground hover:text-nerva-cyan transition-colors"
          >
            Back to Nerva AI
          </a>
        </div>
      </div>
    </div>
  );
}
