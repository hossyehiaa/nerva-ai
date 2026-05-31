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

// GET - List agents for a business
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  }

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const agents = await db.agent.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(agents);
}

// POST - Create a new agent
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { businessId, name, type, config } = await req.json();

  if (!businessId || !name || !type) {
    return NextResponse.json({ error: 'businessId, name, and type are required' }, { status: 400 });
  }

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const agent = await db.agent.create({
    data: {
      businessId,
      name,
      type,
      status: 'active',
      config: JSON.stringify(config || {}),
    },
  });

  return NextResponse.json(agent, { status: 201 });
}

// PUT - Update agent
export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, type, status, config } = await req.json();

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const business = await db.business.findUnique({ where: { id: agent.businessId } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updated = await db.agent.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      ...(status && { status }),
      ...(config !== undefined && { config: JSON.stringify(config) }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE - Delete agent
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const business = await db.business.findUnique({ where: { id: agent.businessId } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.agent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
