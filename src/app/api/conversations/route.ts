import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db, withRetry, isRetryableError } from '@/lib/db';

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

// GET - Get conversation history for a business/agent
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const agentId = searchParams.get('agentId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  }

  try {
    const business = await withRetry(() => db.business.findUnique({ where: { id: businessId } }), 5, 1500);
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const filter: Record<string, unknown> = { businessId };
    if (agentId) filter.agentId = agentId;

    const conversations = await withRetry(() => db.conversation.findMany({
      where: filter,
      orderBy: { createdAt: 'asc' },
      take: 50,
    }), 5, 1500);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Conversations GET error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Clear conversation history
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const agentId = searchParams.get('agentId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  }

  try {
    const business = await withRetry(() => db.business.findUnique({ where: { id: businessId } }), 5, 1500);
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const filter: Record<string, unknown> = { businessId };
    if (agentId) filter.agentId = agentId;

    await withRetry(() => db.conversation.deleteMany({ where: filter }), 5, 1500);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Conversations DELETE error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
