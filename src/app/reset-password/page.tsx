'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Lock, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Extract token from URL and verify it
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) {
      setVerifying(false);
      setError('Missing reset token. Please request a new password reset link.');
      return;
    }
    setToken(t);
    verifyToken(t);
  }, []);

  const verifyToken = async (t: string) => {
    try {
      const res = await fetch(`/api/auth/reset-password?token=${t}`);
      const data = await res.json();
      setTokenValid(data.valid === true);
      if (!data.valid) {
        setError(data.error || 'This reset link is invalid or has expired. Please request a new one.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter a new password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to reset password. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============ LOADING / VERIFYING ============
  if (verifying) {
    return (
      <div className="min-h-screen bg-nerva-dark flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-nerva-cyan animate-spin" />
          <span className="text-sm text-muted-foreground">Verifying reset link...</span>
        </div>
      </div>
    );
  }

  // ============ INVALID TOKEN ============
  if (!tokenValid && !success) {
    return (
      <div className="min-h-screen bg-nerva-dark flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative z-10 w-full max-w-md">
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center justify-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
                <Zap className="w-5 h-5 text-nerva-dark" />
              </div>
              <span className="text-xl font-bold">
                <span className="gradient-text-cyan">Nerva</span>
                <span className="text-foreground ml-1">AI</span>
              </span>
            </div>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Link Expired</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">{error}</p>

            <Button
              onClick={() => router.push('/')}
              className="w-full shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl"
            >
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ SUCCESS ============
  if (success) {
    return (
      <div className="min-h-screen bg-nerva-dark flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-nerva-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nerva-green/5 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          <div className="glass-card rounded-2xl p-8 glow-cyan">
            <div className="flex items-center justify-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center glow-cyan">
                <Zap className="w-5 h-5 text-nerva-dark" />
              </div>
              <span className="text-xl font-bold">
                <span className="gradient-text-cyan">Nerva</span>
                <span className="text-foreground ml-1">AI</span>
              </span>
            </div>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-nerva-green/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-nerva-green" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Password Reset!</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>

            <Button
              onClick={() => router.push('/')}
              className="w-full shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl"
            >
              Sign In Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ RESET FORM ============
  return (
    <div className="min-h-screen bg-nerva-dark flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-nerva-cyan/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nerva-blue/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-nerva-cyan transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </button>

        <div className="glass-card rounded-2xl p-8 glow-cyan">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center glow-cyan">
              <Zap className="w-5 h-5 text-nerva-dark" />
            </div>
            <span className="text-xl font-bold">
              <span className="gradient-text-cyan">Nerva</span>
              <span className="text-foreground ml-1">AI</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2">Set New Password</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter your new password below. Make sure it&apos;s at least 6 characters.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="New password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-muted/50 border-nerva-border focus:border-nerva-cyan/50 h-12 rounded-xl"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 bg-muted/50 border-nerva-border focus:border-nerva-cyan/50 h-12 rounded-xl"
              />
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full ${
                        password.length >= 12 && level <= 4
                          ? 'bg-nerva-green'
                          : password.length >= 8 && level <= 3
                            ? 'bg-nerva-cyan'
                            : password.length >= 6 && level <= 2
                              ? 'bg-amber-400'
                              : level <= 1 && password.length >= 1
                                ? 'bg-red-400'
                                : 'bg-muted/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {password.length >= 12
                    ? 'Strong password'
                    : password.length >= 8
                      ? 'Good password'
                      : password.length >= 6
                        ? 'Acceptable password'
                        : 'Too short'}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || password.length < 6 || password !== confirmPassword}
              className="w-full shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
