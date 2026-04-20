import { db } from '../../src/lib/db/client';
import { HoopgridService } from '../../src/lib/services/features/hoopgridService';
import { hoopgridChallenges, players as playersTable } from '../../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function recalculate() {
  console.log("🔄 Recalculating possibilities for today's challenge...");

  const today = new Date().toISOString().split('T')[0];
  const challenge = await db.query.hoopgridChallenges.findFirst({
    where: (ch, { eq }) => eq(ch.gameDate, today),
  });

  if (!challenge) {
    console.log('❌ No challenge found for today.');
    return;
  }

  const rows = typeof challenge.rows === 'string' ? JSON.parse(challenge.rows) : challenge.rows;
  const cols = typeof challenge.cols === 'string' ? JSON.parse(challenge.cols) : challenge.cols;
  const allPlayers = await db.select({ id: playersTable.id }).from(playersTable);

  const possibleCounts = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let count = 0;
      for (const p of allPlayers) {
        const fits =
          (await HoopgridService.checkCriteria(p.id, rows[r])) &&
          (await HoopgridService.checkCriteria(p.id, cols[c]));
        if (fits) count++;
      }
      possibleCounts.push(count);
      console.log(`   Cell ${r},${c}: ${count} solutions found.`);
    }
  }

  await db
    .update(hoopgridChallenges)
    .set({ possibleCounts: JSON.stringify(possibleCounts) })
    .where(eq(hoopgridChallenges.id, challenge.id));

  console.log("✅ Today's challenge updated with possibility counts!");
  process.exit(0);
}

recalculate();
