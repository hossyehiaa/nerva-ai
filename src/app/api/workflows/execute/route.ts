import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
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

  const workflow = await db.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  // Verify ownership
  const business = await db.business.findUnique({ where: { id: workflow.businessId } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await WorkflowEngine.executeWorkflow(workflowId, { trigger: 'manual' });

  return NextResponse.json({ success: true, results });
}
