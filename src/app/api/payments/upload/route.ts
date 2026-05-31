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

// POST - Upload a payment screenshot
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const screenshot = formData.get('screenshot') as File | null;
    const paymentId = formData.get('paymentId') as string | null;

    if (!screenshot) {
      return NextResponse.json(
        { error: 'Screenshot file is required' },
        { status: 400 }
      );
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Verify the payment belongs to the user
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== user.id) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(screenshot.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (screenshot.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert screenshot to base64 data URL for storage
    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${screenshot.type};base64,${base64}`;

    // Update the payment record with the screenshot URL
    const updated = await db.payment.update({
      where: { id: paymentId },
      data: { screenshotUrl: dataUrl },
    });

    return NextResponse.json({
      success: true,
      paymentId: updated.id,
      screenshotUrl: updated.screenshotUrl ? 'uploaded' : null,
    });
  } catch (error) {
    console.error('Screenshot upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload screenshot' },
      { status: 500 }
    );
  }
}
