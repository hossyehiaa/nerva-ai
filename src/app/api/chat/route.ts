import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { businessId, message, agentId } = await req.json();

    if (!businessId || !message) {
      return NextResponse.json({ error: 'businessId and message are required' }, { status: 400 });
    }

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Determine the system prompt - agent-specific or business-level
    let systemPrompt = business.systemPrompt;
    if (agentId) {
      const agent = await db.agent.findUnique({ where: { id: agentId } });
      if (agent && agent.systemPrompt) {
        systemPrompt = agent.systemPrompt;
      } else if (agent) {
        // If agent exists but has no custom prompt, generate one based on type
        systemPrompt = getAgentSystemPromptFallback(agent.type, business.name, business.contextData);
      }
    }

    // Save user message
    await db.conversation.create({
      data: { businessId, agentId: agentId || null, role: 'user', content: message },
    });

    // Get recent conversation history (last 8 messages) filtered by agentId if provided
    const historyFilter: Record<string, unknown> = { businessId };
    if (agentId) {
      historyFilter.agentId = agentId;
    }
    const history = await db.conversation.findMany({
      where: historyFilter,
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    history.reverse();

    // Build messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
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
      // Fallback response
      aiResponse = generateFallbackResponse(message, business.name);
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
          source: 'ai_chat',
        },
      });
      // Remove the lead tag from display
      aiResponse = aiResponse.replace(leadRegex, '').trim();
    }

    // Detect orders in AI response (for barista agents)
    const orderRegex = /\[ORDER:\s*items="([^"]*?)"\s*total="([^"]*?)"\]/;
    const orderMatch = aiResponse.match(orderRegex);
    if (orderMatch) {
      // Remove the order tag from display but keep the info
      aiResponse = aiResponse.replace(orderRegex, '').trim();
    }

    // Save AI response
    await db.conversation.create({
      data: { businessId, agentId: agentId || null, role: 'assistant', content: aiResponse },
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getAgentSystemPromptFallback(agentType: string, businessName: string, businessContext: string): string {
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

function generateFallbackResponse(message: string, businessName: string): string {
  const lower = message.toLowerCase();
  if (/price|cost|how much|pricing|rate|fee/.test(lower)) {
    return `Thank you for your interest in ${businessName}! For pricing details, could you share your name and phone number so our team can get back to you with the best offer?`;
  }
  if (/hello|hi|hey|greetings|good morning|good evening/.test(lower)) {
    return `Hello! Welcome to ${businessName}! How can I help you today?`;
  }
  if (/hours|open|close|schedule|when/.test(lower)) {
    return `Thank you for reaching out to ${businessName}! For our hours of operation and availability, could you share your contact info so we can assist you better?`;
  }
  return `Thank you for contacting ${businessName}! Could you please share your name and phone number so I can better assist you?`;
}
