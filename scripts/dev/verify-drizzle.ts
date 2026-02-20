import 'dotenv/config';
import { getExtendedStandings } from '../src/lib/db/queries/competition/standings';
import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔍 Starting Drizzle Verification...');

  try {
    // 1. Test Connection & Schema Mapping
    console.log('\n1️⃣  Testing Basic Connection & Schema...');
    const userCount = await db.select({ count: sql`count(*)` }).from(users);
    console.log(`   ✅ Connection successful! Found ${userCount[0].count} users in DB.`);

    // 2. Test the specific migrated query
    console.log('\n2️⃣  Testing "getExtendedStandings" (New TS Query)...');
    console.time('   Query Time');
    const standings = await getExtendedStandings({ sortBy: 'total_points', direction: 'desc' });
    console.timeEnd('   Query Time');

    if (standings.length > 0) {
      console.log(`   ✅ Query returned ${standings.length} rows.`);
      const topUser = standings[0];
      console.log('   🏆 Top User:', {
        name: topUser.name,
        points: topUser.total_points,
        wins: topUser.round_wins,
        team_value: topUser.team_value
      });
      
      // Validation: Check if critical fields are present (not null/undefined)
      if (topUser.total_points === undefined || topUser.total_points === null) {
        throw new Error('❌ "total_points" is missing or null!');
      }
      console.log('   ✅ Data structure looks correct.');
    } else {
      console.log('   ⚠️  Query returned 0 rows. (Is the DB empty?)');
    }

  } catch (error) {
    console.error('\n❌ Verification FAILED:', error);
    process.exit(1);
  } finally {
    console.log('\n🏁 Verification Complete.');
    process.exit(0);
  }
}

main();
