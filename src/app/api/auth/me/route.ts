import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db, withRetry } from '@/lib/db';

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
    // Use withRetry with more retries and longer delays for Neon cold starts
    try {
      const user = await withRetry(() => db.user.findUnique({
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
      }), 5, 1500); // 5 retries, 1.5s base delay = up to ~25s total wait

      if (!user) {
        // User was deleted from DB but JWT is still valid
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(user);
    } catch (dbError) {
      // Database is truly unavailable after all retries
      // Return minimal user data from the JWT so the user stays logged in
      // The dashboard will load businesses separately via /api/business
      console.warn('[Auth/Me] DB query failed after retries, returning JWT payload as fallback:', dbError instanceof Error ? dbError.message : String(dbError));
      return NextResponse.json({
        id: payload.id as string,
        email: payload.email as string,
        name: (payload.name as string) || null,
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
