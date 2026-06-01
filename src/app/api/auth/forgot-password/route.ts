import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Please enter your email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration attacks
    // (don't reveal whether an email exists in our system)
    if (!user) {
      console.log('[ForgotPassword] No account found for:', normalizedEmail);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link shortly.',
      });
    }

    // Invalidate any existing reset tokens for this user
    await db.passwordReset.updateMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await db.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Build the reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (req.headers.get('host')?.includes('localhost')
        ? 'http://localhost:3000'
        : 'https://nerva-ai.vercel.app');
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send the email
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      userName: user.name,
    });

    if (!emailResult.success) {
      console.error('[ForgotPassword] Email send failed:', emailResult.error);
      // Still return success to not reveal email existence
      // But log the error for debugging
    }

    console.log('[ForgotPassword] Reset link generated for:', normalizedEmail);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
    });
  } catch (error) {
    console.error('[ForgotPassword] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
