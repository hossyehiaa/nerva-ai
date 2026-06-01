import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // This is expected during build time — API routes only work at runtime
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') {
      // Only warn in dev or server context, not during static generation
    }
  } else {
    // Auto-convert direct connection to pooled connection for better serverless performance
    // Neon pooled connections use the "-pooler" suffix after the endpoint ID
    // Direct:   ep-xxx.region.aws.neon.tech  ->  Pooled: ep-xxx-pooler.region.aws.neon.tech
    if (databaseUrl.includes('.neon.tech') && !databaseUrl.includes('-pooler')) {
      // Match: ep-<endpoint-id>.<rest> and insert -pooler after endpoint-id
      databaseUrl = databaseUrl.replace(/^(postgresql:\/\/[^@]+@ep-[^.]+)(\..+\.neon\.tech)/, '$1-pooler$2');
      console.log('[DB] Using Neon pooled connection for better serverless performance');
    }
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
// Neon free tier databases auto-suspend after 5 minutes of inactivity
// Waking up takes 5-15 seconds, so we need generous retry logic
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, delayMs = 1500): Promise<T> {
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
        errorMsg.includes('connection') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('Timeout') ||
        errorMsg.includes('ECONNRESET') ||
        errorMsg.includes('ETIMEDOUT') ||
        errorMsg.includes('P1001') || // Can't reach database server
        errorMsg.includes('P1008') || // Operations timed out
        errorMsg.includes('P1017') || // Server has closed the connection
        errorMsg.includes('P2024') || // Timed out fetching a connection from the pool
        errorMsg.includes('socket') ||
        errorMsg.includes('reset');      // Connection reset

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = delayMs * attempt; // Exponential-ish backoff: 1.5s, 3s, 4.5s, 6s, 7.5s
      console.warn(`[DB] Retry ${attempt}/${maxRetries} after error: ${errorMsg.substring(0, 100)} — waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// Helper to detect retryable DB errors (Neon cold starts, connection issues, etc.)
export function isRetryableError(error: unknown): boolean {
  const errorMsg = error instanceof Error ? error.message : String(error);
  return (
    errorMsg.includes('Connection') ||
    errorMsg.includes('connection') ||
    errorMsg.includes('timeout') ||
    errorMsg.includes('Timeout') ||
    errorMsg.includes('ECONNRESET') ||
    errorMsg.includes('ETIMEDOUT') ||
    errorMsg.includes('P1001') ||
    errorMsg.includes('P1008') ||
    errorMsg.includes('P1017') ||
    errorMsg.includes('P2024') ||
    errorMsg.includes('socket') ||
    errorMsg.includes('reset')
  );
}

// Warm up the database connection — call this on page load or cron
export async function warmupDb(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    console.log('[DB] Warmup successful');
    return true;
  } catch (error) {
    console.warn('[DB] Warmup failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await db.$disconnect();
  });
}
