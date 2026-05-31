import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.startsWith('file:') && process.env.VERCEL) {
    // On Vercel with SQLite (which doesn't work), create a client anyway
    // It will fail on queries but the app won't crash at startup
    console.warn('[DB] Warning: SQLite DATABASE_URL detected on Vercel. API routes will not work properly. Please set a PostgreSQL DATABASE_URL.');
  }

  return new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
