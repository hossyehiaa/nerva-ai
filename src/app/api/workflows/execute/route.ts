import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db, withRetry, isRetryableError } from '@/lib/db';
import { WorkflowEngine } from '@/lib/workflow-engine';

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

// POST - Manually execute a workflow
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { workflowId } = await req.json();
  if (!workflowId) {
    return NextResponse.json({ error: 'workflowId is required' }, { status: 400 });
  }

  try {
    const workflow = await withRetry(() => db.workflow.findUnique({ where: { id: workflowId } }), 5, 1500);
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Verify ownership
    const business = await withRetry(() => db.business.findUnique({ where: { id: workflow.businessId } }), 5, 1500);
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await WorkflowEngine.executeWorkflow(workflowId, { trigger: 'manual' });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Workflow execute error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
