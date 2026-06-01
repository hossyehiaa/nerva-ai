import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/setup
 * One-time admin account creation endpoint.
 * This creates the admin user if it doesn't exist.
 * After the admin is created, this endpoint will refuse further creations.
 */
export async function POST(req: NextRequest) {
  try {
    // Check if an admin user already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists. Use the admin login page.' },
        { status: 409 }
      );
    }

    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await db.user.create({
      data: {
        email,
        passwordHash,
        name: name || 'Admin',
        role: 'admin',
      },
    });

    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      message: 'Admin account created successfully. You can now log in at /admin/login',
    }, { status: 201 });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
