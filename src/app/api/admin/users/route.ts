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

// GET - List all users with their businesses (admin only)
export async function GET(req: NextRequest) {
  const user = await getAdminUser(req);
  if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      businesses: {
        select: {
          id: true,
          name: true,
          industry: true,
          subscriptionStatus: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(users);
}
