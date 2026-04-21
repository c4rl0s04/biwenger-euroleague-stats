import * as dotenv from 'dotenv';
import * as path from 'path';

// Load Env at the very top
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import { hoopgridChallenges } from '../../lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Script to generate a series of high-difficulty Hoopgrid challenges.
 * Usage: npx tsx src/scripts/hoopgrid/generate-hard.ts [count] [minDifficulty]
 */
async function main() {
  const { db } = await import('../../lib/db');
  const { hoopgridService } = await import('../../lib/services/features/hoopgridService');

  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 5;
  const minDifficulty = parseInt(args[1]) || 80;

  console.log(
    `🚀 Starting generation of ${count} challenges with min difficulty ${minDifficulty}...`
  );

  // Get the last challenge date
  const lastChallenge = await db.query.hoopgridChallenges.findFirst({
    orderBy: desc(hoopgridChallenges.gameDate),
  });

  let startDate = new Date();
  if (lastChallenge) {
    startDate = new Date(lastChallenge.gameDate);
    startDate.setDate(startDate.getDate() + 1);
  }

  for (let i = 0; i < count; i++) {
    const targetDate = startDate.toISOString().split('T')[0];
    console.log(`\n📅 Generating for ${targetDate}...`);

    try {
      const challenge = await hoopgridService.generateDailyChallenge(targetDate, minDifficulty);
      const complexity = hoopgridService.calculateComplexity(challenge.possibleCounts);
      console.log(
        `✅ Success! Challenge #${challenge.number} generated with complexity: ${complexity}`
      );

      startDate.setDate(startDate.getDate() + 1);
    } catch (error) {
      console.error(`❌ Failed for ${targetDate}:`, error);
    }
  }

  console.log('\n✨ Generation complete.');
  process.exit(0);
}

main().catch(console.error);
