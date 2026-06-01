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

function generateKnowledgeSystemPrompt(name: string, industry: string, contextData: string): string {
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

// POST - Chat with the knowledge base (employee-facing AI chatbot)
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { businessId, message } = await req.json();

    if (!businessId || !message) {
      return NextResponse.json(
        { error: 'businessId and message are required' },
        { status: 400 }
      );
    }

    // Verify the business belongs to the user
    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if there are knowledge documents
    const docCount = await db.knowledgeDoc.count({ where: { businessId } });

    if (docCount === 0) {
      return NextResponse.json({
        response: "I don't have any knowledge base documents yet. Please add documents (policies, procedures, onboarding guides, etc.) to your Internal Knowledge Base first, and then I'll be able to answer your questions.",
        source: 'no_docs',
      });
    }

    // Build the knowledge system prompt
    let systemPrompt = business.systemPrompt;
    if (!systemPrompt || !business.contextData) {
      // Rebuild system prompt from documents
      const docs = await db.knowledgeDoc.findMany({
        where: { businessId },
        orderBy: { createdAt: 'asc' },
      });
      const contextData = docs.map(d => `--- ${d.title} ---\n${d.content}`).join('\n\n');
      systemPrompt = generateKnowledgeSystemPrompt(business.name, business.industry, contextData);

      // Update business with regenerated prompt
      await db.business.update({
        where: { id: businessId },
        data: { contextData, systemPrompt },
      });
    }

    // Get or create knowledge agent for this business
    let knowledgeAgent = await db.agent.findFirst({
      where: { businessId, type: 'knowledge' },
    });

    if (!knowledgeAgent) {
      // Auto-create knowledge agent if it doesn't exist
      knowledgeAgent = await db.agent.create({
        data: {
          businessId,
          name: `${business.name} - Knowledge Base`,
          type: 'knowledge',
          status: 'active',
          config: JSON.stringify({ model: 'llama-3.3-70b-versatile' }),
          systemPrompt: systemPrompt,
        },
      });
    }

    const historyFilter: Record<string, unknown> = { businessId };
    if (knowledgeAgent) {
      historyFilter.agentId = knowledgeAgent.id;
    }

    const history = await db.conversation.findMany({
      where: historyFilter,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    history.reverse();

    // Build messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
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
          temperature: 0.5, // Lower temperature for more factual responses
          max_tokens: 800,
        }),
      });

      if (!groqRes.ok) {
        throw new Error(`Groq API error: ${groqRes.status}`);
      }

      const groqData = await groqRes.json();
      aiResponse = groqData.choices?.[0]?.message?.content || 'I could not process that question. Please try again.';
    } catch {
      aiResponse = 'I\'m having trouble connecting right now. Please try again in a moment.';
    }

    // Save user message and AI response as conversations
    await db.conversation.create({
      data: {
        businessId,
        agentId: knowledgeAgent?.id || null,
        role: 'user',
        content: message,
      },
    });

    await db.conversation.create({
      data: {
        businessId,
        agentId: knowledgeAgent?.id || null,
        role: 'assistant',
        content: aiResponse,
      },
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Knowledge chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
