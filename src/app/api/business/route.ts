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

// GET - List user's businesses
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const businesses = await db.business.findMany({
    where: { userId: user.id as string },
    include: { agents: true, _count: { select: { leads: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(businesses);
}

// POST - Create a new business (onboarding)
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, industry, contextData } = await req.json();

  if (!name || !industry) {
    return NextResponse.json({ error: 'Name and industry are required' }, { status: 400 });
  }

  const systemPrompt = generateSystemPrompt(name, industry, contextData || '');

  const business = await db.business.create({
    data: {
      userId: user.id as string,
      name,
      industry,
      contextData: contextData || '',
      systemPrompt,
    },
  });

  // Auto-create a WhatsApp agent
  await db.agent.create({
    data: {
      businessId: business.id,
      name: `${name} - WhatsApp Agent`,
      type: 'whatsapp',
      status: 'active',
      config: JSON.stringify({ model: 'llama-3.3-70b-versatile' }),
    },
  });

  return NextResponse.json(business, { status: 201 });
}

// PUT - Update business
export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, industry, contextData } = await req.json();

  const business = await db.business.findUnique({ where: { id } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const systemPrompt = generateSystemPrompt(
    name || business.name,
    industry || business.industry,
    contextData ?? business.contextData
  );

  const updated = await db.business.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(industry && { industry }),
      ...(contextData !== undefined && { contextData }),
      systemPrompt,
    },
  });

  return NextResponse.json(updated);
}

// DELETE - Delete business
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const business = await db.business.findUnique({ where: { id } });
  if (!business || business.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.business.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
