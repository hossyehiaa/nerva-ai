import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nerva-ai-secret-key-change-in-production'
);

async function getAdminUser(req: NextRequest) {
  const token = req.cookies.get('nerva-token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'admin') return null;
    return payload;
  } catch {
    return null;
  }
}

// GET - List all businesses with owner info (admin only)
export async function GET(req: NextRequest) {
  const user = await getAdminUser(req);
  if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const businesses = await db.business.findMany({
    select: {
      id: true,
      name: true,
      industry: true,
      subscriptionStatus: true,
      agentLimit: true,
      leadLimit: true,
      createdAt: true,
      user: {
        select: { email: true, name: true },
      },
      _count: {
        select: { leads: true, agents: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(businesses);
}
