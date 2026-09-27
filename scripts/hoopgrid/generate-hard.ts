import * as dotenv from 'dotenv';
import * as path from 'path';

// Load Env at the very top
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

/**
 * Script to generate a series of high-difficulty Hoopgrid challenges.
 * Usage: npx tsx scripts/hoopgrid/generate-hard.ts [count] [minDifficulty]
 */
async function main() {
  const { hoopgridCommandService } = await import('@/features/hoopgrid/server');

  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 5;
  const minDifficulty = parseInt(args[1]) || 0;
  const maxDifficulty = parseInt(args[2]) || 100;

  console.log(
    `🚀 Starting generation of ${count} challenges with difficulty range [${minDifficulty} - ${maxDifficulty}]...`
  );

  const startDate = await hoopgridCommandService.getNextGenerationDate();

  for (let i = 0; i < count; i++) {
    const targetDate = startDate.toISOString().split('T')[0];
    console.log(`\n📅 Generating for ${targetDate}...`);

    try {
      const challenge = await hoopgridCommandService.generateDailyChallenge(
        targetDate,
        minDifficulty,
        maxDifficulty
      );
      const complexity = hoopgridCommandService.calculateComplexity(challenge.possibleCounts);
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
