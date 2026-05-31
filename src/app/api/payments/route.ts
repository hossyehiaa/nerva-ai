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

// GET - List payments for the authenticated user
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payments = await db.payment.findMany({
    where: { userId: user.id as string },
    select: {
      id: true,
      status: true,
      plan: true,
      amount: true,
      screenshotUrl: true,
      createdAt: true,
      businessId: true,
      currency: true,
      method: true,
      adminNote: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(payments);
}

// POST - Create a new payment record
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { businessId, plan, amount } = await req.json();

  if (!businessId || !plan || amount === undefined) {
    return NextResponse.json(
      { error: 'businessId, plan, and amount are required' },
      { status: 400 }
    );
  }

  const validPlans = ['starter', 'pro', 'agency'];
  if (!validPlans.includes(plan)) {
    return NextResponse.json(
      { error: 'Invalid plan. Choose: starter, pro, agency' },
      { status: 400 }
    );
  }

  // Verify the business belongs to the user
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const payment = await db.payment.create({
    data: {
      userId: user.id as string,
      businessId,
      plan,
      amount: parseFloat(String(amount)),
      method: 'instapay',
      status: 'pending',
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
