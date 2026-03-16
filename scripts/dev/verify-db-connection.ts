import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

async function main() {
  console.log('🔍 Verifying database connection...');
  try {
    // Import db dynamically using the correct relative path and extension for tsx/esm
    const { db } = await import('../../src/lib/db/index.js');

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
