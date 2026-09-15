import 'dotenv/config';
import path from 'path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL or POSTGRES_URL is required to run migrations.');
    process.exit(1);
  }

  console.log('🚀 Running committed Drizzle migrations...');
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client);
    const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations applied successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void main();
