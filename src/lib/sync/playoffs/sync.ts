import { playoffPredictions, teams, playoffResults } from '../../db/schema';
import { assertSyncSeasonWritable } from '../season-guard';
import { loadPlayoffImport } from './input';

async function syncPlayoffData() {
  const { seasonId, predictions, media, results } = loadPlayoffImport(process.argv.slice(2));
  const { db, pgClient } = await import('../../db');
  await assertSyncSeasonWritable(pgClient, seasonId);

  console.log(
    `🚀 Starting sync: ${predictions.length} predictions, ${media.length} media, ${results?.length || 0} results...`
  );

  // Fetch all teams for name resolution
  const allTeams = await db.select().from(teams);

  // Sync Predictions
  for (const pred of predictions) {
    let winnerId = pred.predictedWinnerId;

    if (pred.predictedWinnerName) {
      const winnerName = pred.predictedWinnerName.toLowerCase();
      const team = allTeams.find(
        (t) =>
          t.name?.toLowerCase().includes(winnerName) ||
          t.shortName?.toLowerCase().includes(winnerName)
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
        seasonId,
        stage: pred.stage,
        matchId: pred.matchId,
        predictedWinnerId: winnerId,
        predictionDetails: pred.predictionDetails,
      })
      .onConflictDoUpdate({
        target: [
          playoffPredictions.seasonId,
          playoffPredictions.userId,
          playoffPredictions.stage,
          playoffPredictions.matchId,
        ],
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
        const winnerName = res.winnerName.toLowerCase();
        const team = allTeams.find(
          (t) =>
            t.name?.toLowerCase().includes(winnerName) ||
            t.shortName?.toLowerCase().includes(winnerName)
        );
        winnerId = team?.id;
      }

      await db
        .insert(playoffResults)
        .values({
          matchId: res.matchId,
          seasonId,
          stage: res.stage || res.matchId.split('-')[0].toLowerCase(),
          winnerId: winnerId,
          score: res.score,
          isCompleted: res.isCompleted ?? true,
        })
        .onConflictDoUpdate({
          target: [playoffResults.seasonId, playoffResults.matchId],
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
