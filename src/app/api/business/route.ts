import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db, withRetry } from '@/lib/db';

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

function getAgentSystemPrompt(agentType: string, businessName: string, businessContext: string): string {
  const basePrompt = `You are a professional AI assistant for "${businessName}".\n\nBusiness Knowledge:\n${businessContext}\n\n`;

  const typePrompts: Record<string, string> = {
    whatsapp: `${basePrompt}You are a WhatsApp sales agent. Be conversational, friendly, and concise. Your goal is to help customers and naturally collect their name and phone number as a lead. When you detect the customer has shared their name and phone, output: [LEAD: name="their_name" phone="their_phone"]. Always respond in the same language the customer uses.`,
    barista: `${basePrompt}You are a digital waiter/barista for a cafe/restaurant. Help customers browse the menu, place orders, and answer questions about food/drinks. Be warm and inviting. When an order is placed, output: [ORDER: items="their_items" total="estimated_total"].`,
    knowledge: `${basePrompt}You are an internal knowledge base assistant. Help employees find information about company policies, procedures, and documentation. Be precise and reference specific information from the knowledge base.`,
    leadgen: `${basePrompt}You are a lead generation agent. Proactively engage potential customers, qualify leads by asking about their needs and budget, and collect their contact information. When qualified, output: [LEAD: name="their_name" phone="their_phone" interest="their_interest"].`,
    content: `${basePrompt}You are a content creation assistant. Help generate marketing copy, social media posts, and content ideas based on the business's products and services. Be creative and on-brand.`,
    workflow: `${basePrompt}You are a workflow automation assistant. Help users set up and manage automated business processes. Guide them through connecting different services and creating workflow rules.`,
    voice: `${basePrompt}You are a voice call agent simulation. Respond as if you're having a phone conversation - be brief, clear, and conversational. Your responses will be converted to speech, so avoid special characters and keep sentences short.`,
  };

  return typePrompts[agentType] || basePrompt;
}

// GET - List user's businesses
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businesses = await withRetry(() => db.business.findMany({
      where: { userId: user.id as string },
      include: { agents: true, _count: { select: { leads: true, knowledgeDocs: true, workflows: true } } },
      orderBy: { createdAt: 'desc' },
    }));

    return NextResponse.json(businesses);
  } catch (error) {
    console.error('[Business GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load businesses. The database may be waking up — please try again.' },
      { status: 500 }
    );
  }
}

// POST - Create a new business (onboarding)
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, industry, contextData } = await req.json();

    if (!name || !industry) {
      return NextResponse.json({ error: 'Name and industry are required' }, { status: 400 });
    }

    const systemPrompt = generateSystemPrompt(name, industry, contextData || '');

    const business = await withRetry(() => db.business.create({
      data: {
        userId: user.id as string,
        name,
        industry,
        contextData: contextData || '',
        systemPrompt,
      },
    }));

    // Auto-create a WhatsApp agent with its own system prompt
    const agentSystemPrompt = getAgentSystemPrompt('whatsapp', name, contextData || '');
    await withRetry(() => db.agent.create({
      data: {
        businessId: business.id,
        name: `${name} - WhatsApp Agent`,
        type: 'whatsapp',
        status: 'active',
        config: JSON.stringify({ model: 'llama-3.3-70b-versatile' }),
        systemPrompt: agentSystemPrompt,
      },
    }));

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error('[Business POST] Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('Connection') || errorMsg.includes('timeout') || errorMsg.includes('P1001') || errorMsg.includes('P1008')) {
      return NextResponse.json(
        { error: 'Database is waking up. Please try again in a few seconds.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create business. Please try again.' },
      { status: 500 }
    );
  }
}

// PUT - Update business
export async function PUT(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, name, industry, contextData, whatsappNumber, whatsappInstance } = await req.json();

    const business = await withRetry(() => db.business.findUnique({ where: { id } }));
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Only regenerate system prompt if name/industry/contextData changed
    const promptChanged = name || industry || contextData !== undefined;
    const systemPrompt = promptChanged
      ? generateSystemPrompt(
          name || business.name,
          industry || business.industry,
          contextData ?? business.contextData
        )
      : business.systemPrompt;

    const updated = await withRetry(() => db.business.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(industry && { industry }),
        ...(contextData !== undefined && { contextData }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(whatsappInstance !== undefined && { whatsappInstance }),
        ...(promptChanged && { systemPrompt }),
      },
    }));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Business PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update business. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE - Delete business
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const business = await withRetry(() => db.business.findUnique({ where: { id } }));
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await withRetry(() => db.business.delete({ where: { id } }));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Business DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete business. Please try again.' },
      { status: 500 }
    );
  }
}
