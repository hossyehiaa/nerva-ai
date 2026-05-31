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

function getAgentSystemPrompt(agentType: string, businessName: string, businessContext: string): string {
  const basePrompt = `You are a professional AI assistant for "${businessName}".\n\nBusiness Knowledge:\n${businessContext}\n\n`;

  const typePrompts: Record<string, string> = {
    whatsapp: `${basePrompt}You are a WhatsApp sales agent. Be conversational, friendly, and concise. Your goal is to help customers and naturally collect their name and phone number as a lead. When you detect the customer has shared their name and phone, output: [LEAD: name="their_name" phone="their_phone"]. Always respond in the same language the customer uses.`,
    barista: `${basePrompt}You are a digital waiter/barista for a cafe/restaurant. Help customers browse the menu, place orders, and answer questions about food/drinks. Be warm and inviting. When an order is placed, output: [ORDER: items="their_items" total="estimated_total"].`,
    knowledge: `${basePrompt}You are an internal knowledge base assistant for company employees. Help employees find information about company policies, onboarding procedures, HR guidelines, customer support protocols, call center scripts, and internal processes. Be precise and reference specific documents. You are NOT for external customers - only for internal staff. If you don't know something, say so rather than guessing.`,
    leadgen: `${basePrompt}You are a lead generation agent. Proactively engage potential customers, qualify leads by asking about their needs and budget, and collect their contact information. When qualified, output: [LEAD: name="their_name" phone="their_phone" interest="their_interest"].`,
    content: `${basePrompt}You are a content creation assistant. Help generate marketing copy, social media posts, and content ideas based on the business's products and services. Be creative and on-brand.`,
    workflow: `${basePrompt}You are a workflow automation assistant. Help users set up and manage automated business processes. Guide them through connecting different services and creating workflow rules.`,
    voice: `${basePrompt}You are a voice call agent simulation. Respond as if you're having a phone conversation - be brief, clear, and conversational. Your responses will be converted to speech, so avoid special characters and keep sentences short.`,
  };

  return typePrompts[agentType] || basePrompt;
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

  // Subscription check - agent limits
  const agentLimits: Record<string, number> = { free: 1, starter: 3, pro: 7, agency: 999 };
  const currentAgents = await db.agent.count({ where: { businessId } });
  const limit = agentLimits[business.subscriptionStatus] || 1;
  if (currentAgents >= limit) {
    return NextResponse.json({ error: 'Agent limit reached. Please upgrade your plan.' }, { status: 403 });
  }

  // Auto-generate system prompt based on agent type
  const systemPrompt = getAgentSystemPrompt(type, business.name, business.contextData);

  const agent = await db.agent.create({
    data: {
      businessId,
      name,
      type,
      status: 'active',
      config: typeof config === 'string' ? config : JSON.stringify(config || {}),
      systemPrompt,
    },
  });

  return NextResponse.json(agent, { status: 201 });
}

// PUT - Update agent
export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, type, status, config, systemPrompt } = await req.json();

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
      ...(config !== undefined && { config: typeof config === 'string' ? config : JSON.stringify(config) }),
      ...(systemPrompt !== undefined && { systemPrompt }),
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
