import { db } from '../../db';
import { playoffPredictions, userPlayoffMedia, teams, playoffResults } from '../../db/schema';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function syncPlayoffData() {
  const dataPath = path.join(process.cwd(), 'src/lib/sync/playoffs/playoff-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const { predictions, media, results } = JSON.parse(rawData);

  console.log(
    `🚀 Starting sync: ${predictions.length} predictions, ${media.length} media, ${results?.length || 0} results...`
  );

  // Fetch all teams for name resolution
  const allTeams = await db.select().from(teams);

  // Sync Predictions
  for (const pred of predictions) {
    let winnerId = pred.predictedWinnerId;

    if (pred.predictedWinnerName) {
      const team = allTeams.find(
        (t) =>
          t.name?.toLowerCase().includes(pred.predictedWinnerName.toLowerCase()) ||
          t.shortName?.toLowerCase().includes(pred.predictedWinnerName.toLowerCase())
      );
      if (team) {
        winnerId = team.id;
      } else {
        console.warn(`⚠️ Could not find team matching name: ${pred.predictedWinnerName}`);
        continue;
      }
    }

    if (!winnerId) {
      console.warn(`⚠️ No winner ID or Name for match ${pred.matchId} (User: ${pred.userId})`);
      continue;
    }

    await db
      .insert(playoffPredictions)
      .values({
        userId: pred.userId,
        stage: pred.stage,
        matchId: pred.matchId,
        predictedWinnerId: winnerId,
        predictionDetails: pred.predictionDetails,
      })
      .onConflictDoUpdate({
        target: [playoffPredictions.userId, playoffPredictions.stage, playoffPredictions.matchId],
        set: {
          predictedWinnerId: winnerId,
          predictionDetails: pred.predictionDetails,
        },
      });
  }

  // Sync Results
  if (results) {
    for (const res of results) {
      let winnerId = null;
      if (res.winnerName) {
        const team = allTeams.find(
          (t) =>
            t.name?.toLowerCase().includes(res.winnerName.toLowerCase()) ||
            t.shortName?.toLowerCase().includes(res.winnerName.toLowerCase())
        );
        winnerId = team?.id;
      }

      await db
        .insert(playoffResults)
        .values({
          matchId: res.matchId,
          stage: res.stage || res.matchId.split('-')[0].toLowerCase(),
          winnerId: winnerId,
          score: res.score,
          isCompleted: res.isCompleted ?? true,
        })
        .onConflictDoUpdate({
          target: [playoffResults.matchId],
          set: {
            winnerId: winnerId,
            score: res.score,
            isCompleted: res.isCompleted ?? true,
          },
        });
    }
  }

  console.log('✅ Playoff data sync completed!');
  process.exit(0);
}

syncPlayoffData().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
