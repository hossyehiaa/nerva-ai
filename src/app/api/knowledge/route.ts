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

function generateSystemPrompt(name: string, industry: string, contextData: string): string {
  return `You are a professional AI sales representative for "${name}", a business in the ${industry} industry.

Your knowledge base:
${contextData}

Your goals:
1. Answer customer questions accurately based on the knowledge base above
2. Naturally collect the customer's name and phone number during conversation
3. Handle objections professionally and suggest solutions
4. Upsell relevant products/services when appropriate
5. Be friendly, helpful, and conversational

When you detect the customer has shared their name and phone number, output: [LEAD: name="their_name" phone="their_phone"]

Always respond in the same language the customer uses (Arabic or English).
If you don't know something, say "Let me connect you with our team for more details" rather than guessing.`;
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

  // Verify the business belongs to the user
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const docs = await db.knowledgeDoc.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(docs);
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

  // Verify the business belongs to the user
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Create the knowledge doc
  const doc = await db.knowledgeDoc.create({
    data: {
      businessId,
      title,
      content,
      category: category || 'general',
    },
  });

  // Update the business contextData by appending this doc's content
  const separator = business.contextData ? '\n\n' : '';
  const updatedContextData = business.contextData + separator + `--- ${title} ---\n${content}`;

  // Regenerate the system prompt
  const systemPrompt = generateSystemPrompt(business.name, business.industry, updatedContextData);

  await db.business.update({
    where: { id: businessId },
    data: {
      contextData: updatedContextData,
      systemPrompt,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}

// PUT - Update a knowledge doc
export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, title, content, category } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'Knowledge doc ID is required' }, { status: 400 });
  }

  const doc = await db.knowledgeDoc.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Verify the business belongs to the user
  const business = await db.business.findUnique({ where: { id: doc.businessId } });
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
  const updated = await db.knowledgeDoc.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(category !== undefined && { category }),
    },
  });

  // If content or title changed, rebuild the business contextData and systemPrompt
  if (content !== undefined || title !== undefined) {
    const allDocs = await db.knowledgeDoc.findMany({
      where: { businessId: doc.businessId },
      orderBy: { createdAt: 'asc' },
    });

    const contextData = allDocs
      .map((d) => `--- ${d.title} ---\n${d.content}`)
      .join('\n\n');

    const systemPrompt = generateSystemPrompt(business.name, business.industry, contextData);

    await db.business.update({
      where: { id: doc.businessId },
      data: { contextData, systemPrompt },
    });
  }

  return NextResponse.json(updated);
}

// DELETE - Delete a knowledge doc
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const doc = await db.knowledgeDoc.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Verify the business belongs to the user
  const business = await db.business.findUnique({ where: { id: doc.businessId } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete the doc
  await db.knowledgeDoc.delete({ where: { id } });

  // Rebuild contextData and systemPrompt from remaining docs
  const remainingDocs = await db.knowledgeDoc.findMany({
    where: { businessId: doc.businessId },
    orderBy: { createdAt: 'asc' },
  });

  const contextData = remainingDocs
    .map((d) => `--- ${d.title} ---\n${d.content}`)
    .join('\n\n');

  const systemPrompt = generateSystemPrompt(business.name, business.industry, contextData);

  await db.business.update({
    where: { id: doc.businessId },
    data: { contextData, systemPrompt },
  });

  return NextResponse.json({ success: true });
}
