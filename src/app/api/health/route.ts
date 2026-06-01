import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Simple query to keep the Neon database connection alive
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Health] Database ping failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
