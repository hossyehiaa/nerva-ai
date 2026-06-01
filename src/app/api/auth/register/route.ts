import { NextRequest, NextResponse } from 'next/server';
import { db, withRetry, isRetryableError } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const existing = await withRetry(() => db.user.findUnique({ where: { email } }), 5, 1500);
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await withRetry(() => db.user.create({
      data: { email, passwordHash, name: name || null },
    }), 5, 1500);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    if (isRetryableError(error)) {
      return NextResponse.json({ error: 'Database connection error. Please try again.', retryable: true }, { status: 503 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
