/**
 * Build script for Nerva AI
 * Switches Prisma schema between SQLite (local) and PostgreSQL (production/Vercel)
 */
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const sqliteSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');
const postgresqlSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');

const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL || '';

// Determine which schema to use
let usePostgres = isProduction;

// If DATABASE_URL looks like a PostgreSQL connection string, use PostgreSQL schema
if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  usePostgres = true;
}

// If DATABASE_URL looks like a SQLite file path, use SQLite schema
if (dbUrl.startsWith('file:')) {
  usePostgres = false;
}

const sourceSchema = usePostgres ? postgresqlSchemaPath : sqliteSchemaPath;

console.log(`[Build] Database URL starts with: ${dbUrl.substring(0, 20)}...`);
console.log(`[Build] Using ${usePostgres ? 'PostgreSQL' : 'SQLite'} schema`);

if (fs.existsSync(sourceSchema)) {
  fs.copyFileSync(sourceSchema, schemaPath);
  console.log(`[Build] Copied ${usePostgres ? 'PostgreSQL' : 'SQLite'} schema to schema.prisma`);
} else {
  console.log(`[Build] Source schema not found at ${sourceSchema}, using current schema.prisma`);
}

// Generate Prisma client
const { execSync } = require('child_process');
try {
  console.log('[Build] Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('[Build] Prisma client generated successfully');

  // If PostgreSQL, push schema to database
  if (usePostgres && dbUrl.startsWith('postgresql://')) {
    console.log('[Build] Pushing PostgreSQL schema to database...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('[Build] Database schema pushed successfully');
    } catch (e) {
      console.warn('[Build] Warning: Could not push schema to database:', e.message);
    }
  }
} catch (e) {
  console.error('[Build] Error generating Prisma client:', e.message);
  process.exit(1);
}
