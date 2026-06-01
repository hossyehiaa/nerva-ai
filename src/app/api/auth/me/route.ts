import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nerva-ai-secret-key-change-in-production'
);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('nerva-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the JWT first — this does NOT require database access
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Try to get full user data with businesses from the database
    try {
      const user = await db.user.findUnique({
        where: { id: payload.id as string },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          businesses: {
            include: {
              agents: true,
              _count: { select: { leads: true, knowledgeDocs: true, workflows: true } },
            },
          },
        },
      });

      if (!user) {
        // User was deleted from DB but JWT is still valid
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(user);
    } catch (dbError) {
      // Database is unavailable (Neon cold start, timeout, etc.) but JWT is VALID
      // Return minimal user data from the JWT so the user stays logged in
      console.warn('[Auth/Me] DB query failed, returning JWT payload as fallback:', dbError instanceof Error ? dbError.message : String(dbError));
      return NextResponse.json({
        id: payload.id as string,
        email: payload.email as string,
        name: null,
        role: payload.role as string,
        businesses: [],
        _partial: true,
      });
    }
  } catch {
    // JWT verification failed — token is invalid or expired
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
