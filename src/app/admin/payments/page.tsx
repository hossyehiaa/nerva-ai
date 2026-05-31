'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  CreditCard,
  AlertTriangle,
  Clock,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/admin');
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
        setAccessDenied(false);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch payments.',
        variant: 'destructive',
      });
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
      fetchPayments();
    }
  }, [user, authLoading, fetchPayments]);

  const handleAction = async (paymentId: string, action: 'approve' | 'reject') => {
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
          description: `The payment has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
        });
        // Refresh list
        await fetchPayments();
      } else {
        const data = await res.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to process payment.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatPlanName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const planColors: Record<string, string> = {
    starter: 'text-blue-400 bg-blue-500/10',
    pro: 'text-purple-400 bg-purple-500/10',
    agency: 'text-amber-400 bg-amber-500/10',
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
          <p className="text-sm text-muted-foreground">
            You don&apos;t have admin privileges to view this page.
          </p>
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

  // ============ IMAGE PREVIEW MODAL ============
  const imagePreviewModal = previewImage && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => setPreviewImage(null)}
    >
      <div
        className="glass-card rounded-2xl p-2 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img
            src={previewImage}
            alt="Payment screenshot"
            className="w-full rounded-xl object-contain max-h-[70vh]"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ============ MAIN PAGE ============
  return (
    <div className="min-h-screen bg-nerva-dark">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-nerva-dark" />
              </div>
              <h1 className="text-2xl font-bold">Payment Review</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-[52px]">
              Review and approve pending subscription payments
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayments}
            className="border-nerva-border self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
              <Clock className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold">{payments.length}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="w-9 h-9 rounded-lg bg-nerva-cyan/10 flex items-center justify-center mb-2">
              <CreditCard className="w-4.5 h-4.5 text-nerva-cyan" />
            </div>
            <div className="text-2xl font-bold">
              {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total EGP</div>
          </div>
          <div className="glass-card rounded-xl p-4 col-span-2 sm:col-span-1">
            <div className="w-9 h-9 rounded-lg bg-nerva-green/10 flex items-center justify-center mb-2">
              <User className="w-4.5 h-4.5 text-nerva-green" />
            </div>
            <div className="text-2xl font-bold">
              {new Set(payments.map((p) => p.userId)).size}
            </div>
            <div className="text-xs text-muted-foreground">Unique Users</div>
          </div>
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-nerva-green/40 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">All Caught Up!</h3>
            <p className="text-sm text-muted-foreground">
              No pending payments to review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="glass-card rounded-xl p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Left: Payment details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center text-nerva-dark text-xs font-bold flex-shrink-0">
                        {payment.user.name?.[0] || payment.user.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {payment.user.name || 'Unnamed User'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {payment.user.email}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Plan</div>
                        <span
                          className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${
                            planColors[payment.plan] || 'text-muted-foreground bg-muted/20'
                          }`}
                        >
                          {formatPlanName(payment.plan)}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Amount</div>
                        <div className="font-semibold">
                          {payment.amount.toLocaleString()} {payment.currency}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Method</div>
                        <div className="capitalize text-sm">{payment.method}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Date</div>
                        <div className="text-sm">
                          {new Date(payment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      {payment.screenshotUrl && (
                        <div className="col-span-2 sm:col-span-1">
                          <div className="text-xs text-muted-foreground mb-0.5">Screenshot</div>
                          <button
                            onClick={() => setPreviewImage(payment.screenshotUrl)}
                            className="flex items-center gap-1.5 text-xs text-nerva-cyan hover:text-nerva-cyan/80 transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            View Screenshot
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action buttons */}
                  <div className="flex sm:flex-col gap-2 sm:ml-4 flex-shrink-0">
                    <Button
                      onClick={() => handleAction(payment.id, 'approve')}
                      disabled={processingId === payment.id}
                      className="flex-1 sm:flex-none shine-effect bg-gradient-to-r from-nerva-green to-emerald-500 text-white font-semibold rounded-xl h-10 px-4"
                    >
                      {processingId === payment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAction(payment.id, 'reject')}
                      disabled={processingId === payment.id}
                      variant="outline"
                      className="flex-1 sm:flex-none border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl h-10 px-4"
                    >
                      {processingId === payment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin footer note */}
        <div className="mt-8 text-center text-xs text-muted-foreground/40">
          <ShieldCheck className="w-3 h-3 inline mr-1" />
          Admin Panel &mdash; Payment approvals update business subscription limits automatically
        </div>
      </div>

      {imagePreviewModal}
    </div>
  );
}
