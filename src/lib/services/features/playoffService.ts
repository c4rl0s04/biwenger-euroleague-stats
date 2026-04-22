import 'server-only';
import { db } from '../../db';
import {
  playoffPredictions,
  playoffResults,
  userPlayoffMedia,
  users,
  teams,
} from '../../db/schema';
import { eq, and } from 'drizzle-orm';

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
  const allUsers = await db.select().from(users);
  const predictions = await db.select().from(playoffPredictions);
  const results = await db.select().from(playoffResults);
  const media = await db.select().from(userPlayoffMedia);

  const leaderboard = allUsers.map((user) => {
    const userPredictions = predictions.filter((p) => p.userId === user.id);
    const userMedia = media.find((m) => m.userId === user.id);

    let totalPoints = 0;
    let correctCount = 0;
    const predictionStats = userPredictions.map((p) => {
      const result = results.find((r) => r.matchId === p.matchId);
      const isCorrect =
        result && result.isCompleted ? result.winnerId === p.predictedWinnerId : null;
      const points = isCorrect ? SCORING_RULES[p.stage as keyof typeof SCORING_RULES] || 0 : 0;

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
      totalCount: userPredictions.length,
      accuracy: userPredictions.length > 0 ? (correctCount / userPredictions.length) * 100 : 0,
      imageUrl: userMedia?.predictionImageUrl,
      predictions: predictionStats,
    };
  });

  return leaderboard.sort((a, b) => b.points - a.points);
}

export async function getPlayoffResults() {
  return await db.select().from(playoffResults);
}

export async function getTeams() {
  return await db.select().from(teams);
}
