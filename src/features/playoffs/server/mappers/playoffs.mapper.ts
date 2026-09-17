import type { PlayoffFacts } from '../queries/playoff.records';
import type { PlayoffLeaderboardRow } from '../../models/playoffs';

export const SCORING_RULES = { 'play-in': 1, quarter: 3, semi: 6, final: 10 };

export function mapPlayoffLeaderboard({
  allUsers,
  predictions,
  results,
  media,
}: PlayoffFacts): PlayoffLeaderboardRow[] {
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
        id: p.id,
        userId: p.userId,
        seasonId: p.seasonId,
        stage: p.stage,
        matchId: p.matchId,
        predictedWinnerId: p.predictedWinnerId,
        predictionDetails: p.predictionDetails,
        points: p.points,
        createdAt: p.createdAt == null ? p.createdAt : p.createdAt.toISOString(),
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
