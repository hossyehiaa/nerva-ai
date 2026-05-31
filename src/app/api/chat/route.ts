import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { businessId, message } = await req.json();

    if (!businessId || !message) {
      return NextResponse.json({ error: 'businessId and message are required' }, { status: 400 });
    }

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Save user message
    await db.conversation.create({
      data: { businessId, role: 'user', content: message },
    });

    // Get recent conversation history (last 8 messages)
    const history = await db.conversation.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    history.reverse();

    // Build messages for AI
    const messages = [
      { role: 'system', content: business.systemPrompt },
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

    // Save AI response
    await db.conversation.create({
      data: { businessId, role: 'assistant', content: aiResponse },
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateFallbackResponse(message: string, businessName: string): string {
  const lower = message.toLowerCase();
  if (/سعر|تكلفة|كم|price|cost|how much/.test(lower)) {
    return `Thank you for your interest in ${businessName}! For pricing details, could you share your name and phone number so our team can get back to you with the best offer?`;
  }
  if (/مرحب|هلا|اهلا|hello|hi|hey/.test(lower)) {
    return `Hello! Welcome to ${businessName}! How can I help you today?`;
  }
  return `Thank you for contacting ${businessName}! Could you please share your name and phone number so I can better assist you?`;
}
