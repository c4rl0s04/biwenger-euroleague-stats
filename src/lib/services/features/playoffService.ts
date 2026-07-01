import 'server-only';
import { db } from '../../db';
import {
  playoffPredictions,
  playoffResults,
  userPlayoffMedia,
  users,
  teams,
  userSeasons,
} from '../../db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { resolveReadSeasonId } from '../../db/season-context';

/**
 * Playoff Service
 * Business logic for Euroleague Play-in and Playoff predictions
 */

export const SCORING_RULES = {
  'play-in': 1,
  quarter: 3,
  semi: 6,
  final: 10,
};

export async function getPlayoffLeaderboard() {
  const seasonId = await resolveReadSeasonId();
  const allUsers = await db
    .select({
      id: users.id,
      name: sql<string>`COALESCE(${userSeasons.name}, ${users.name})`,
      icon: sql<string | null>`COALESCE(${userSeasons.icon}, ${users.icon})`,
      colorIndex: sql<number>`COALESCE(${userSeasons.colorIndex}, ${users.colorIndex}, 0)`,
    })
    .from(users)
    .innerJoin(
      userSeasons,
      and(eq(userSeasons.userId, users.id), eq(userSeasons.seasonId, seasonId))
    )
    .where(sql`COALESCE(${userSeasons.status}, 'active') <> 'inactive'`);
  const predictions = await db
    .select()
    .from(playoffPredictions)
    .where(eq(playoffPredictions.seasonId, seasonId));
  const results = await db
    .select()
    .from(playoffResults)
    .where(eq(playoffResults.seasonId, seasonId));
  const media = await db
    .select()
    .from(userPlayoffMedia)
    .where(eq(userPlayoffMedia.seasonId, seasonId));

  const leaderboard = allUsers.map((user) => {
    const userPredictions = predictions.filter((p) => p.userId === user.id);
    const userMedia = media.find((m) => m.userId === user.id);

    let totalPoints = 0;
    let correctCount = 0;
    let finishedCount = 0;

    const predictionStats = userPredictions.map((p) => {
      const result = results.find((r) => r.matchId === p.matchId);
      const isCorrect =
        result && result.isCompleted ? result.winnerId === p.predictedWinnerId : null;
      const points = isCorrect ? SCORING_RULES[p.stage as keyof typeof SCORING_RULES] || 0 : 0;

      if (result && result.isCompleted) {
        finishedCount++;
      }

      if (isCorrect) {
        totalPoints += points;
        correctCount++;
      }

      return {
        ...p,
        isCorrect,
        actualWinnerId: result?.winnerId,
        resultScore: result?.score,
      };
    });

    return {
      userId: user.id,
      userName: user.name,
      userIcon: user.icon,
      colorIndex: user.colorIndex,
      points: totalPoints,
      correctCount,
      totalCount: finishedCount,
      accuracy: finishedCount > 0 ? (correctCount / finishedCount) * 100 : 0,
      imageUrl: userMedia?.predictionImageUrl,
      predictions: predictionStats,
    };
  });

  return leaderboard.sort((a, b) => b.points - a.points);
}

export async function getPlayoffResults() {
  const seasonId = await resolveReadSeasonId();
  return await db.select().from(playoffResults).where(eq(playoffResults.seasonId, seasonId));
}

export async function getTeams() {
  return await db.select().from(teams);
}
