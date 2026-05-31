import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Public: Get business info for the barista chatbot
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;

  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      agents: {
        where: { status: 'active' },
      },
    },
  });

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  // Try to find a barista agent first, then fall back to any agent
  const baristaAgent = business.agents.find(a => a.type === 'barista') || business.agents[0];

  // Extract menu items from the agent config if available
  let menuItems: unknown[] = [];
  if (baristaAgent) {
    try {
      const config = JSON.parse(baristaAgent.config);
      menuItems = config.menu || [];
    } catch {
      // Config is not valid JSON, skip menu
    }
  }

  return NextResponse.json({
    name: business.name,
    industry: business.industry,
    contextData: business.contextData,
    menuItems,
  });
}

// POST - Public: Send a message to the barista chatbot
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const { message, sessionId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
      include: {
        agents: {
          where: { status: 'active' },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Try to find a barista agent first, then fall back to any agent
    const baristaAgent = business.agents.find(a => a.type === 'barista') || business.agents[0];

    // Determine the system prompt - use agent's prompt or business prompt or fallback
    let systemPrompt: string;
    if (baristaAgent?.systemPrompt) {
      systemPrompt = baristaAgent.systemPrompt;
    } else if (business.systemPrompt) {
      systemPrompt = business.systemPrompt;
    } else {
      // Fallback barista prompt
      systemPrompt = `You are a digital waiter/barista for "${business.name}", a business in the ${business.industry} industry.\n\nBusiness Knowledge:\n${business.contextData}\n\nHelp customers browse the menu, place orders, and answer questions about food/drinks. Be warm and inviting. When an order is placed, output: [ORDER: items="their_items" total="estimated_total"]. Always respond in the same language the customer uses.`;
    }

    // Save user message as conversation
    await db.conversation.create({
      data: {
        businessId,
        agentId: baristaAgent?.id || null,
        role: 'user',
        content: message,
      },
    });

    // Get recent conversation history for this session (last 8 messages)
    const history = await db.conversation.findMany({
      where: {
        businessId,
        ...(baristaAgent?.id ? { agentId: baristaAgent.id } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    history.reverse();

    // Build messages for AI
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    // Call Groq API
    let aiResponse: string;
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!groqRes.ok) {
        throw new Error(`Groq API error: ${groqRes.status}`);
      }

      const groqData = await groqRes.json();
      aiResponse = groqData.choices?.[0]?.message?.content || 'Sorry, I could not process that.';
    } catch {
      aiResponse = `Welcome to ${business.name}! How can I help you today?`;
    }

    // Detect orders in AI response (for barista agents)
    const orderRegex = /\[ORDER:\s*items="([^"]*?)"\s*total="([^"]*?)"\]/;
    const orderMatch = aiResponse.match(orderRegex);
    if (orderMatch) {
      // Remove the order tag from display
      aiResponse = aiResponse.replace(orderRegex, '').trim();
    }

    // Detect leads in AI response
    const leadRegex = /\[LEAD:\s*name="([^"]*?)"\s*phone="([^"]*?)"\]/;
    const leadMatch = aiResponse.match(leadRegex);
    if (leadMatch) {
      const leadName = leadMatch[1];
      const leadPhone = leadMatch[2];
      await db.lead.create({
        data: {
          businessId,
          customerName: leadName,
          customerContact: leadPhone,
          intent: message,
          source: 'barista',
        },
      });
      aiResponse = aiResponse.replace(leadRegex, '').trim();
    }

    // Save AI response
    await db.conversation.create({
      data: {
        businessId,
        agentId: baristaAgent?.id || null,
        role: 'assistant',
        content: aiResponse,
      },
    });

    return NextResponse.json({ response: aiResponse, sessionId });
  } catch (error) {
    console.error('Barista chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
