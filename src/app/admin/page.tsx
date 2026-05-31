'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Zap, Loader2, ShieldCheck, CheckCircle2, XCircle,
  Eye, RefreshCw, CreditCard, Clock, User, Image as ImageIcon,
  BarChart3, Users, Building2, Settings, LogOut, ChevronDown,
  AlertTriangle, DollarSign, TrendingUp, Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AdminTab = 'overview' | 'payments' | 'users' | 'businesses';

interface PaymentRecord {
  id: string;
  userId: string;
  businessId: string | null;
  amount: number;
  currency: string;
  plan: string;
  method: string;
  screenshotUrl: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
}

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  businesses: { id: string; name: string; industry: string; subscriptionStatus: string }[];
}

interface BusinessRecord {
  id: string;
  name: string;
  industry: string;
  subscriptionStatus: string;
  agentLimit: number;
  leadLimit: number;
  createdAt: string;
  user: { email: string; name: string | null };
  _count: { leads: number; agents: number };
}

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [paymentsRes, usersRes, businessesRes] = await Promise.all([
        fetch('/api/admin/payments'),
        fetch('/api/admin/users'),
        fetch('/api/admin/businesses'),
      ]);

      if (paymentsRes.status === 401 || paymentsRes.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (businessesRes.ok) setBusinesses(await businessesRes.json());
      setAccessDenied(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      fetchData();
    }
  }, [user, authLoading, fetchData]);

  const handlePaymentAction = async (paymentId: string, action: 'approve' | 'reject') => {
    let adminNote: string | undefined;
    if (action === 'reject') {
      adminNote = prompt('Enter rejection reason (optional):') || '';
    }
    setProcessingId(paymentId);
    try {
      const res = await fetch('/api/payments/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action, adminNote }),
      });
      if (res.ok) {
        toast({
          title: action === 'approve' ? 'Payment Approved' : 'Payment Rejected',
          description: `Subscription ${action === 'approve' ? 'activated' : 'rejected'} successfully.`,
        });
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/admin/login';
  };

  // ============ AUTH LOADING ============
  if (authLoading) {
    return (
      <div className="min-h-screen bg-nerva-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nerva-cyan animate-spin" />
      </div>
    );
  }

  // ============ ACCESS DENIED ============
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-nerva-dark flex items-center justify-center px-4">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative z-10 glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You don&apos;t have admin privileges to view this page.
          </p>
          <Button
            onClick={() => window.location.href = '/admin/login'}
            className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark rounded-xl"
          >
            Go to Admin Login
          </Button>
        </div>
      </div>
    );
  }

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="min-h-screen bg-nerva-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nerva-cyan animate-spin" />
      </div>
    );
  }

  // ============ COMPUTED STATS ============
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const approvedPayments = payments.filter(p => p.status === 'approved');
  const totalRevenue = approvedPayments.reduce((s, p) => s + p.amount, 0);
  const filteredPayments = paymentFilter === 'all'
    ? payments
    : payments.filter(p => p.status === paymentFilter);

  const planColors: Record<string, string> = {
    starter: 'text-blue-400 bg-blue-500/10',
    pro: 'text-purple-400 bg-purple-500/10',
    agency: 'text-amber-400 bg-amber-500/10',
  };
  const statusColors: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-500/10',
    approved: 'text-nerva-green bg-nerva-green/10',
    rejected: 'text-red-400 bg-red-500/10',
  };

  // ============ NAV ITEMS ============
  const navItems: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'businesses', label: 'Businesses', icon: Building2 },
  ];

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-nerva-dark flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-nerva-border bg-[#020509] flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 p-5 border-b border-nerva-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
            <Zap className="w-4 h-4 text-nerva-dark" />
          </div>
          <span className="text-lg font-bold">
            <span className="gradient-text-cyan">Nerva</span>
            <span className="text-foreground ml-1">Admin</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-nerva-cyan/10 text-nerva-cyan font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.id === 'payments' && pendingPayments.length > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                  {pendingPayments.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-3 border-t border-nerva-border">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user?.name || 'Admin'}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-nerva-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
              <Zap className="w-4 h-4 text-nerva-dark" />
            </div>
            <span className="font-bold gradient-text-cyan">Nerva Admin</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted/20"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-nerva-border p-2 flex flex-wrap gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  activeTab === item.id ? 'bg-nerva-cyan/10 text-nerva-cyan' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-nerva-dark" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Overview</h1>
                  <p className="text-sm text-muted-foreground">Platform statistics and management</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-card rounded-xl p-4">
                  <div className="w-9 h-9 rounded-lg bg-nerva-cyan/10 flex items-center justify-center mb-2">
                    <Users className="w-4.5 h-4.5 text-nerva-cyan" />
                  </div>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <div className="text-xs text-muted-foreground">Total Users</div>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="w-9 h-9 rounded-lg bg-nerva-green/10 flex items-center justify-center mb-2">
                    <Building2 className="w-4.5 h-4.5 text-nerva-green" />
                  </div>
                  <div className="text-2xl font-bold">{businesses.length}</div>
                  <div className="text-xs text-muted-foreground">Businesses</div>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
                    <Clock className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-400">{pendingPayments.length}</div>
                  <div className="text-xs text-muted-foreground">Pending Payments</div>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="w-9 h-9 rounded-lg bg-nerva-green/10 flex items-center justify-center mb-2">
                    <DollarSign className="w-4.5 h-4.5 text-nerva-green" />
                  </div>
                  <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Revenue (EGP)</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Pending Payments */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Pending Payments
                    </h3>
                    {pendingPayments.length > 0 && (
                      <button onClick={() => setActiveTab('payments')} className="text-xs text-nerva-cyan hover:underline">
                        View all
                      </button>
                    )}
                  </div>
                  {pendingPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending payments</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingPayments.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/10">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{p.user.name || p.user.email}</div>
                            <div className="text-xs text-muted-foreground">{p.amount.toLocaleString()} EGP - {p.plan}</div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => handlePaymentAction(p.id, 'approve')} className="p-1.5 rounded-lg bg-nerva-green/10 text-nerva-green hover:bg-nerva-green/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handlePaymentAction(p.id, 'reject')} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Users */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-nerva-cyan" />
                      Recent Users
                    </h3>
                    <button onClick={() => setActiveTab('users')} className="text-xs text-nerva-cyan hover:underline">
                      View all
                    </button>
                  </div>
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
                  ) : (
                    <div className="space-y-2">
                      {users.slice(0, 5).map(u => (
                        <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center text-nerva-dark text-xs font-bold flex-shrink-0">
                            {u.name?.[0] || u.email[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{u.name || 'User'}</div>
                            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-muted-foreground">{u.businesses.length} biz</div>
                            <div className="text-[10px] text-muted-foreground/60">{new Date(u.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription Breakdown */}
              <div className="glass-card rounded-2xl p-6 mt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-nerva-green" />
                  Subscription Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['free', 'starter', 'pro', 'agency'].map(plan => {
                    const count = businesses.filter(b => b.subscriptionStatus === plan).length;
                    return (
                      <div key={plan} className="p-3 rounded-xl bg-muted/10 text-center">
                        <div className="text-xl font-bold capitalize">{count}</div>
                        <div className="text-xs text-muted-foreground capitalize">{plan}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===== PAYMENTS TAB ===== */}
          {activeTab === 'payments' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Payment Management</h1>
                    <p className="text-sm text-muted-foreground">Review and approve subscription payments</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-muted/20 rounded-xl p-1">
                    {['all', 'pending', 'approved', 'rejected'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setPaymentFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                          paymentFilter === filter
                            ? 'bg-nerva-cyan/10 text-nerva-cyan'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchData} className="border-nerva-border">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                  </Button>
                </div>
              </div>

              {/* Payment Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="glass-card rounded-xl p-4">
                  <div className="text-2xl font-bold text-amber-400">{pendingPayments.length}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="text-2xl font-bold text-nerva-green">{approvedPayments.length}</div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} EGP</div>
                  <div className="text-xs text-muted-foreground">Total Revenue</div>
                </div>
              </div>

              {/* Payments List */}
              {filteredPayments.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-nerva-green/40 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-1">All Caught Up!</h3>
                  <p className="text-sm text-muted-foreground">No {paymentFilter === 'all' ? '' : paymentFilter} payments to review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments.map(payment => (
                    <div key={payment.id} className="glass-card rounded-xl p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Left: Payment details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center text-nerva-dark text-xs font-bold flex-shrink-0">
                              {payment.user.name?.[0] || payment.user.email[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{payment.user.name || 'Unnamed User'}</div>
                              <div className="text-xs text-muted-foreground truncate">{payment.user.email}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">Plan</div>
                              <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${planColors[payment.plan] || 'text-muted-foreground bg-muted/20'}`}>
                                {payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1)}
                              </span>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">Amount</div>
                              <div className="font-semibold">{payment.amount.toLocaleString()} {payment.currency}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">Status</div>
                              <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[payment.status] || statusColors.pending}`}>
                                {payment.status}
                              </span>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">Date</div>
                              <div className="text-sm">{new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                            {payment.screenshotUrl && (
                              <div className="col-span-2 sm:col-span-1">
                                <div className="text-xs text-muted-foreground mb-0.5">Screenshot</div>
                                <button
                                  onClick={() => setPreviewImage(payment.screenshotUrl)}
                                  className="flex items-center gap-1.5 text-xs text-nerva-cyan hover:text-nerva-cyan/80 transition-colors"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" /> View Screenshot
                                </button>
                              </div>
                            )}
                          </div>

                          {payment.adminNote && (
                            <div className="mt-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
                              <span className="font-medium">Admin Note:</span> {payment.adminNote}
                            </div>
                          )}
                        </div>

                        {/* Right: Action buttons */}
                        {payment.status === 'pending' && (
                          <div className="flex sm:flex-col gap-2 sm:ml-4 flex-shrink-0">
                            <Button
                              onClick={() => handlePaymentAction(payment.id, 'approve')}
                              disabled={processingId === payment.id}
                              className="flex-1 sm:flex-none shine-effect bg-gradient-to-r from-nerva-green to-emerald-500 text-white font-semibold rounded-xl h-10 px-4"
                            >
                              {processingId === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve</>
                              )}
                            </Button>
                            <Button
                              onClick={() => handlePaymentAction(payment.id, 'reject')}
                              disabled={processingId === payment.id}
                              variant="outline"
                              className="flex-1 sm:flex-none border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl h-10 px-4"
                            >
                              <XCircle className="w-4 h-4 mr-1.5" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== USERS TAB ===== */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-nerva-cyan/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-nerva-cyan" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Users</h1>
                  <p className="text-sm text-muted-foreground">{users.length} registered users</p>
                </div>
              </div>

              {users.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No users yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map(u => (
                    <div key={u.id} className="glass-card rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center text-nerva-dark text-sm font-bold flex-shrink-0">
                          {u.name?.[0] || u.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{u.name || 'User'}</span>
                            {u.role === 'admin' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold">Admin</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Joined {new Date(u.createdAt).toLocaleDateString()} | {u.businesses.length} business{u.businesses.length !== 1 ? 'es' : ''}
                          </div>
                          {u.businesses.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {u.businesses.map(b => (
                                <span key={b.id} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground">
                                  {b.name} ({b.subscriptionStatus})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== BUSINESSES TAB ===== */}
          {activeTab === 'businesses' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-nerva-green/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-nerva-green" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Businesses</h1>
                  <p className="text-sm text-muted-foreground">{businesses.length} registered businesses</p>
                </div>
              </div>

              {businesses.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No businesses yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {businesses.map(b => (
                    <div key={b.id} className="glass-card rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-nerva-green/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-nerva-green" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{b.name}</h4>
                            <p className="text-xs text-muted-foreground">{b.industry}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${planColors[b.subscriptionStatus] || 'text-muted-foreground bg-muted/20'}`}>
                                {b.subscriptionStatus}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{b._count.agents} agents</span>
                              <span className="text-[10px] text-muted-foreground">{b._count.leads} leads</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground/60 mt-1">
                              Owner: {b.user.name || b.user.email} | Created: {new Date(b.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
          <div className="glass-card rounded-2xl p-2 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img src={previewImage} alt="Payment screenshot" className="w-full rounded-xl object-contain max-h-[70vh]" />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
