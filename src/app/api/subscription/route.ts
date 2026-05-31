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

// POST - Upgrade/Change subscription plan
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { businessId, plan } = await req.json();

  if (!businessId || !plan) {
    return NextResponse.json({ error: 'businessId and plan are required' }, { status: 400 });
  }

  if (!planLimits[plan]) {
    return NextResponse.json({ error: 'Invalid plan. Choose: free, starter, pro, agency' }, { status: 400 });
  }

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const limits = planLimits[plan];

  // Update business subscription
  const updated = await db.business.update({
    where: { id: businessId },
    data: {
      subscriptionStatus: plan,
      agentLimit: limits.agents,
      leadLimit: limits.leads,
    },
  });

  // Create subscription record
  await db.subscription.create({
    data: {
      userId: user.id as string,
      plan,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return NextResponse.json(updated);
}
