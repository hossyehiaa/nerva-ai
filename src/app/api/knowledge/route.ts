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

function generateSystemPrompt(name: string, industry: string, contextData: string): string {
  return `You are an internal AI assistant for "${name}", a company in the ${industry} industry. You are a private knowledge base chatbot designed exclusively for company employees.

Your knowledge base (company documents, policies, and procedures):
${contextData}

Your goals:
1. Answer employee questions accurately based on the knowledge base above
2. Help employees find information about company policies, onboarding procedures, HR guidelines, customer support protocols, call center scripts, and internal processes
3. Be precise and reference specific information from the knowledge base
4. If an employee asks about something not in the knowledge base, say "I don't have information about that in our current knowledge base. Please check with your manager or HR department." rather than guessing
5. Be professional, helpful, and concise
6. Help with: company policies, onboarding steps, leave policies, dress code, IT support procedures, customer support scripts, escalation procedures, product information, pricing guidelines, and any other internal company information

Important rules:
- You are for INTERNAL employees only, not for customers
- Always cite which document or policy you're referencing when possible
- If multiple documents are relevant, reference all of them
- Keep answers concise but complete
- Respond in the same language the employee uses (Arabic or English)`;
}

// GET - List knowledge docs for a business
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

    const docs = await withRetry(() => db.knowledgeDoc.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    }), 5, 1500);

    return NextResponse.json(docs);
  } catch (error) {
    console.error('Knowledge GET error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new knowledge doc
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { businessId, title, content, category } = await req.json();

  if (!businessId || !title || !content) {
    return NextResponse.json(
      { error: 'businessId, title, and content are required' },
      { status: 400 }
    );
  }

  const validCategories = ['general', 'policy', 'onboarding', 'procedures', 'faq'];
  if (category && !validCategories.includes(category)) {
    return NextResponse.json(
      { error: 'Invalid category. Choose: general, policy, onboarding, procedures, faq' },
      { status: 400 }
    );
  }

  try {
    // Verify the business belongs to the user
    const business = await withRetry(() => db.business.findUnique({ where: { id: businessId } }), 5, 1500);
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Create the knowledge doc
    const doc = await withRetry(() => db.knowledgeDoc.create({
      data: {
        businessId,
        title,
        content,
        category: category || 'general',
      },
    }), 5, 1500);

    // Update the business contextData by appending this doc's content
    const separator = business.contextData ? '\n\n' : '';
    const updatedContextData = business.contextData + separator + `--- ${title} ---\n${content}`;

    // Regenerate the system prompt
    const systemPrompt = generateSystemPrompt(business.name, business.industry, updatedContextData);

    await withRetry(() => db.business.update({
      where: { id: businessId },
      data: {
        contextData: updatedContextData,
        systemPrompt,
      },
    }), 5, 1500);

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Knowledge POST error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a knowledge doc
export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, title, content, category } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'Knowledge doc ID is required' }, { status: 400 });
  }

  try {
    const doc = await withRetry(() => db.knowledgeDoc.findUnique({ where: { id } }), 5, 1500);
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Verify the business belongs to the user
    const business = await withRetry(() => db.business.findUnique({ where: { id: doc.businessId } }), 5, 1500);
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validCategories = ['general', 'policy', 'onboarding', 'procedures', 'faq'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Choose: general, policy, onboarding, procedures, faq' },
        { status: 400 }
      );
    }

    // Update the knowledge doc
    const updated = await withRetry(() => db.knowledgeDoc.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
      },
    }), 5, 1500);

    // If content or title changed, rebuild the business contextData and systemPrompt
    if (content !== undefined || title !== undefined) {
      const allDocs = await withRetry(() => db.knowledgeDoc.findMany({
        where: { businessId: doc.businessId },
        orderBy: { createdAt: 'asc' },
      }), 5, 1500);

      const contextData = allDocs
        .map((d) => `--- ${d.title} ---\n${d.content}`)
        .join('\n\n');

      const systemPrompt = generateSystemPrompt(business.name, business.industry, contextData);

      await withRetry(() => db.business.update({
        where: { id: doc.businessId },
        data: { contextData, systemPrompt },
      }), 5, 1500);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Knowledge PUT error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a knowledge doc
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  try {
    const doc = await withRetry(() => db.knowledgeDoc.findUnique({ where: { id } }), 5, 1500);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Verify the business belongs to the user
    const business = await withRetry(() => db.business.findUnique({ where: { id: doc.businessId } }), 5, 1500);
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the doc
    await withRetry(() => db.knowledgeDoc.delete({ where: { id } }), 5, 1500);

    // Rebuild contextData and systemPrompt from remaining docs
    const remainingDocs = await withRetry(() => db.knowledgeDoc.findMany({
      where: { businessId: doc.businessId },
      orderBy: { createdAt: 'asc' },
    }), 5, 1500);

    const contextData = remainingDocs
      .map((d) => `--- ${d.title} ---\n${d.content}`)
      .join('\n\n');

    const systemPrompt = generateSystemPrompt(business.name, business.industry, contextData);

    await withRetry(() => db.business.update({
      where: { id: doc.businessId },
      data: { contextData, systemPrompt },
    }), 5, 1500);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Knowledge DELETE error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
