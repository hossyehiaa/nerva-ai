import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('[DB] Warning: No DATABASE_URL set. API routes will not work.');
  }

  return new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

// Singleton pattern to avoid creating multiple Prisma clients in dev
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Helper function to execute DB queries with retry logic for Neon cold starts
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Retry on connection errors (Neon cold start, timeout, etc.)
      const isRetryable =
        errorMsg.includes('Connection') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('ECONNRESET') ||
        errorMsg.includes('ETIMEDOUT') ||
        errorMsg.includes('P1001') || // Can't reach database server
        errorMsg.includes('P1008') || // Operations timed out
        errorMsg.includes('P1017');    // Server has closed the connection

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      console.warn(`[DB] Retry ${attempt}/${maxRetries} after error: ${errorMsg.substring(0, 100)}`);
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await db.$disconnect();
  });
}
