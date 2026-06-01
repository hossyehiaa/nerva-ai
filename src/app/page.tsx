'use client';

import { AuthProvider, useAuth } from '@/lib/auth';
import Navbar from '@/components/sections/Navbar';
import Hero from '@/components/sections/Hero';
import WhyNerva from '@/components/sections/WhyNerva';
import Services from '@/components/sections/Services';
import HowItWorks from '@/components/sections/HowItWorks';
import Pricing from '@/components/sections/Pricing';
import FAQ from '@/components/sections/FAQ';
import CTA from '@/components/sections/CTA';
import Footer from '@/components/sections/Footer';
import LoginPage from '@/components/app/LoginPage';
import DashboardPage from '@/components/app/DashboardPage';
import OnboardingPage from '@/components/app/OnboardingPage';
import { useState, useEffect, useRef } from 'react';

function AppRouter() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<'home' | 'login' | 'dashboard' | 'onboarding'>('home');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  // Track if we've already redirected to dashboard for this session
  // This prevents the redirect from being overridden by state changes
  const redirectedRef = useRef(false);

  // If loading takes too long (e.g., cold start), show the landing page anyway
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Redirect to dashboard when user becomes available
  useEffect(() => {
    if (user && !redirectedRef.current) {
      // If user just logged in, always go to dashboard
      if (page === 'login') {
        redirectedRef.current = true;
        setPage('dashboard');
      }
      // If user is on home page and has a session, they can still browse
      // They use the "Dashboard" button in navbar to go to dashboard
    }
  }, [user, page]);

  // Reset redirect flag when user logs out
  useEffect(() => {
    if (!user) {
      redirectedRef.current = false;
      if (page === 'dashboard' || page === 'onboarding') {
        setPage('home');
      }
    }
  }, [user, page]);

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nerva-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-nerva-dark">
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
          </div>
          <span className="text-sm text-muted-foreground">Loading Nerva AI...</span>
        </div>
      </div>
    );
  }

  // Always use the actual user state — never nullify it based on loading
  const effectiveUser = user;

  // Dashboard page (when user explicitly navigates to it)
  if (page === 'dashboard' && effectiveUser) {
    return <DashboardPage onNavigate={setPage} />;
  }

  // Onboarding page
  if (page === 'onboarding' && effectiveUser) {
    return <OnboardingPage onComplete={() => setPage('dashboard')} />;
  }

  // Login page
  if (page === 'login') {
    return (
      <LoginPage
        onBack={() => setPage('home')}
        onLoginSuccess={() => {
          redirectedRef.current = true;
          setPage('dashboard');
        }}
      />
    );
  }

  // Home page (ALWAYS the default - landing page shows for everyone)
  return (
    <div className="min-h-screen flex flex-col bg-nerva-dark">
      <Navbar
        isLoggedIn={!!effectiveUser}
        onLogin={() => setPage('login')}
        onDashboard={() => setPage(effectiveUser ? 'dashboard' : 'login')}
      />
      <main className="flex-1">
        <Hero onGetStarted={() => setPage('login')} />
        <WhyNerva />
        <Services />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <CTA onGetStarted={() => setPage('login')} />
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
