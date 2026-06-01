import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendPasswordChangedEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Find the reset token
    const resetRecord = await db.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (resetRecord.used) {
      return NextResponse.json(
        { error: 'This reset link has already been used. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update the user's password
    await db.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    // Mark the token as used
    await db.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    // Send confirmation email
    await sendPasswordChangedEmail({
      to: resetRecord.user.email,
      userName: resetRecord.user.name,
    });

    console.log('[ResetPassword] Password reset successfully for:', resetRecord.user.email);

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('[ResetPassword] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// GET - Verify if a token is valid (for the reset page to check before showing the form)
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Missing token' }, { status: 400 });
    }

    const resetRecord = await db.passwordReset.findUnique({
      where: { token },
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired token' });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('[ResetPassword] Token verification error:', error);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}
