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

// GET - List payments for the authenticated user
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payments = await db.payment.findMany({
      where: { userId: user.id as string },
      select: {
        id: true,
        status: true,
        plan: true,
        amount: true,
        screenshotUrl: true,
        createdAt: true,
        businessId: true,
        currency: true,
        method: true,
        adminNote: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Payment list error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST - Create a new payment record with screenshot (FormData)
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const contentType = req.headers.get('content-type') || '';

    // Must be FormData with screenshot
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data with screenshot' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const businessId = formData.get('businessId') as string;
    const plan = formData.get('plan') as string;
    const amountStr = formData.get('amount') as string;
    const screenshot = formData.get('screenshot') as File | null;

    if (!businessId || !plan || !amountStr) {
      return NextResponse.json(
        { error: 'businessId, plan, and amount are required' },
        { status: 400 }
      );
    }

    const validPlans = ['starter', 'pro', 'agency'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose: starter, pro, agency' },
        { status: 400 }
      );
    }

    // Verify the business belongs to the user
    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business || business.userId !== user.id) {
      return NextResponse.json({ error: 'Business not found or access denied' }, { status: 404 });
    }

    let screenshotUrl: string | null = null;

    // Process screenshot
    if (screenshot && screenshot.size > 0) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(screenshot.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only images (PNG, JPG, WebP) are allowed.' },
          { status: 400 }
        );
      }

      // Max 3MB to stay within Vercel's 4.5MB serverless limit
      const maxSize = 3 * 1024 * 1024;
      if (screenshot.size > maxSize) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 3MB. Please compress the image and try again.' },
          { status: 400 }
        );
      }

      // Convert to base64 data URL for storage
      const bytes = await screenshot.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      screenshotUrl = `data:${screenshot.type};base64,${base64}`;
    } else {
      return NextResponse.json(
        { error: 'Payment screenshot is required' },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId: user.id as string,
        businessId,
        plan,
        amount: parseFloat(amountStr),
        method: 'instapay',
        status: 'pending',
        screenshotUrl,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment record. Please try again.' },
      { status: 500 }
    );
  }
}
