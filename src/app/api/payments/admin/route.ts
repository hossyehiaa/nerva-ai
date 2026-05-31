import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nerva-ai-secret-key-change-in-production'
);

async function getUser(req: NextRequest) {
  const token = req.cookies.get('nerva-token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

const planLimits: Record<string, { agents: number; leads: number }> = {
  free: { agents: 1, leads: 10 },
  starter: { agents: 3, leads: 100 },
  pro: { agents: 7, leads: 500 },
  agency: { agents: 999, leads: 99999 },
};

// GET - List all pending payments (admin only)
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const payments = await db.payment.findMany({
    where: { status: 'pending' },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(payments);
}

// PUT - Approve or reject a payment (admin only)
export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { paymentId, action, adminNote } = await req.json();

  if (!paymentId || !action) {
    return NextResponse.json(
      { error: 'paymentId and action are required' },
      { status: 400 }
    );
  }

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Choose: approve, reject' },
      { status: 400 }
    );
  }

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  if (payment.status !== 'pending') {
    return NextResponse.json(
      { error: 'Payment has already been processed' },
      { status: 400 }
    );
  }

  if (action === 'approve') {
    // Update payment status
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'approved',
        adminNote: adminNote || null,
      },
    });

    // Update the associated business if businessId exists
    if (payment.businessId) {
      const limits = planLimits[payment.plan] || planLimits.free;
      await db.business.update({
        where: { id: payment.businessId },
        data: {
          subscriptionStatus: payment.plan,
          agentLimit: limits.agents,
          leadLimit: limits.leads,
        },
      });

      // Create a subscription record
      await db.subscription.create({
        data: {
          userId: payment.userId,
          plan: payment.plan,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }

    return NextResponse.json(updatedPayment);
  }

  // Reject
  const updatedPayment = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: 'rejected',
      adminNote: adminNote || null,
    },
  });

  return NextResponse.json(updatedPayment);
}
