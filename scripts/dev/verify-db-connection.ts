import { db } from '../src/lib/db/index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔍 Verifying database connection...');
  try {
    // Execute a simple query relative to time
    const result = await db.execute(sql`SELECT NOW() as now`);
    console.log('✅ Database connection successful!');
    console.log('Timestamp from DB:', result.rows[0].now);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

main();
