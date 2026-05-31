import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

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

// POST - Upload screenshot for a payment
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const screenshot = formData.get('screenshot') as File | null;
    const paymentId = formData.get('paymentId') as string | null;

    if (!screenshot || !paymentId) {
      return NextResponse.json(
        { error: 'screenshot and paymentId are required' },
        { status: 400 }
      );
    }

    // Verify the payment belongs to the user
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== user.id) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Generate unique filename
    const ext = path.extname(screenshot.name) || '.png';
    const filename = `${Date.now()}${ext}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadsDir, filename);

    // Ensure uploads directory exists
    const { mkdir } = await import('fs/promises');
    await mkdir(uploadsDir, { recursive: true });

    // Write the file
    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update the payment record
    const updated = await db.payment.update({
      where: { id: paymentId },
      data: { screenshotUrl: `/uploads/${filename}` },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
