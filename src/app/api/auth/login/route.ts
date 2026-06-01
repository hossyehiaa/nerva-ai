import { NextRequest, NextResponse } from 'next/server';
import { db, withRetry } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nerva-ai-secret-key-change-in-production'
);

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use withRetry to handle Neon cold starts
    const user = await withRetry(() => db.user.findUnique({ where: { email } }));
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });

    // Cookie settings optimized for Vercel (HTTPS) deployment
    response.cookies.set('nerva-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    // Check if it's a database connection error
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('Connection') || errorMsg.includes('timeout') || errorMsg.includes('P1001') || errorMsg.includes('P1008')) {
      return NextResponse.json(
        { error: 'Database is waking up. Please try again in a few seconds.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
