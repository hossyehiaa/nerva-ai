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

// GET - List workflows for a business
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  }

  try {
    // Verify the business belongs to the user
    const business = await withRetry(() => db.business.findUnique({ where: { id: businessId } }), 5, 1500);
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const workflows = await withRetry(() => db.workflow.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    }), 5, 1500);

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Workflows GET error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new workflow
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { businessId, name, description, trigger, triggerConfig, actions } = await req.json();

  if (!businessId || !name || !trigger) {
    return NextResponse.json(
      { error: 'businessId, name, and trigger are required' },
      { status: 400 }
    );
  }

  const validTriggers = ['new_lead', 'new_order', 'schedule', 'manual', 'webhook'];
  if (!validTriggers.includes(trigger)) {
    return NextResponse.json(
      { error: 'Invalid trigger. Choose: new_lead, new_order, schedule, manual, webhook' },
      { status: 400 }
    );
  }

  try {
    // Verify the business belongs to the user
    const business = await withRetry(() => db.business.findUnique({ where: { id: businessId } }), 5, 1500);
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const workflow = await withRetry(() => db.workflow.create({
      data: {
        businessId,
        name,
        description: description || '',
        trigger,
        triggerConfig: triggerConfig ? JSON.stringify(triggerConfig) : '{}',
        actions: actions ? JSON.stringify(actions) : '[]',
      },
    }), 5, 1500);

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Workflows POST error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a workflow
export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, description, trigger, triggerConfig, actions, status } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
  }

  try {
    const workflow = await withRetry(() => db.workflow.findUnique({ where: { id } }), 5, 1500);
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Verify the business belongs to the user
    const business = await withRetry(() => db.business.findUnique({ where: { id: workflow.businessId } }), 5, 1500);
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (status && !['draft', 'active', 'paused'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Choose: draft, active, paused' },
        { status: 400 }
      );
    }

    if (trigger && !['new_lead', 'new_order', 'schedule', 'manual', 'webhook'].includes(trigger)) {
      return NextResponse.json(
        { error: 'Invalid trigger. Choose: new_lead, new_order, schedule, manual, webhook' },
        { status: 400 }
      );
    }

    const updated = await withRetry(() => db.workflow.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(trigger !== undefined && { trigger }),
        ...(triggerConfig !== undefined && { triggerConfig: JSON.stringify(triggerConfig) }),
        ...(actions !== undefined && { actions: JSON.stringify(actions) }),
        ...(status !== undefined && { status }),
      },
    }), 5, 1500);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Workflows PUT error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a workflow
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  try {
    const workflow = await withRetry(() => db.workflow.findUnique({ where: { id } }), 5, 1500);
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Verify the business belongs to the user
    const business = await withRetry(() => db.business.findUnique({ where: { id: workflow.businessId } }), 5, 1500);
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await withRetry(() => db.workflow.delete({ where: { id } }), 5, 1500);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Workflows DELETE error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
