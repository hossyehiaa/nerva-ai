'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Mail, Lock, User, ArrowLeft, Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginPage({ onBack, onLoginSuccess }: LoginPageProps) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (isRegister && !name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      const result = isRegister
        ? await register(email.trim(), password, name.trim())
        : await login(email.trim(), password);

      if (!result.success) {
        setError(result.error || 'Something went wrong. Please try again.');
      } else if (onLoginSuccess) {
        // Directly navigate to dashboard on successful login
        onLoginSuccess();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setForgotSuccess(true);
      } else {
        setForgotError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setForgotError('Network error. Please check your connection and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ============ FORGOT PASSWORD VIEW ============
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-nerva-dark flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-nerva-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nerva-blue/5 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          <button
            onClick={() => {
              setShowForgotPassword(false);
              setForgotSuccess(false);
              setForgotError('');
              setForgotEmail('');
            }}
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

            {forgotSuccess ? (
              // Success state
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-nerva-green/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-nerva-green" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">Check Your Email</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  If an account exists with <span className="text-nerva-cyan font-medium">{forgotEmail}</span>,
                  you will receive a password reset link within a few minutes.
                </p>
                <p className="text-xs text-muted-foreground text-center mb-6">
                  The link will expire in 1 hour. Don&apos;t forget to check your spam folder.
                </p>
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSuccess(false);
                    setForgotEmail('');
                  }}
                  className="w-full shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl"
                >
                  Back to Sign In
                </Button>
              </>
            ) : (
              // Form state
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <KeyRound className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">Forgot Password?</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  No worries! Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                {forgotError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10 bg-muted/50 border-nerva-border focus:border-nerva-cyan/50 h-12 rounded-xl"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl"
                  >
                    {forgotLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============ NORMAL LOGIN/REGISTER VIEW ============
  return (
    <div className="min-h-screen bg-nerva-dark flex items-center justify-center px-4 relative">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-nerva-cyan/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nerva-blue/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-nerva-cyan transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 glow-cyan">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center glow-cyan">
              <Zap className="w-5 h-5 text-nerva-dark" />
            </div>
            <span className="text-xl font-bold">
              <span className="gradient-text-cyan">Nerva</span>
              <span className="text-foreground ml-1">AI</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {isRegister
              ? 'Start building your AI workforce today'
              : 'Sign in to your Nerva AI dashboard'}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {isRegister && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-muted/50 border-nerva-border focus:border-nerva-cyan/50 h-12 rounded-xl"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-muted/50 border-nerva-border focus:border-nerva-cyan/50 h-12 rounded-xl"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-muted/50 border-nerva-border focus:border-nerva-cyan/50 h-12 rounded-xl"
              />
            </div>

            {/* Forgot Password link (only on login) */}
            {!isRegister && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError('');
                  }}
                  className="text-sm text-nerva-cyan hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-nerva-cyan hover:underline font-medium"
            >
              {isRegister ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
