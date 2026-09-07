import 'server-only';
import { calcEfficiency } from '@/lib/utils/efficiency';
import { calculateStats } from '../../logic/performance';
import type {
  UserPerformanceHistory,
  RoundLeaderboardViewModel,
  AllUsersPerformanceHistoryViewModel,
} from '../../models/round-read';
import { getUserRoundsHistoryDAO, getCoachRating } from '../queries/round-analysis.query';
import { readManagerDirectory } from '../queries/directory.query';

export function createRoundHistoryService(deps: {
  history: typeof getUserRoundsHistoryDAO;
  coach: typeof getCoachRating;
  managers: typeof readManagerDirectory;
}) {
  async function getUserPerformanceHistoryService(
    userId: string | number
  ): Promise<UserPerformanceHistory[]> {
    const rounds = await deps.history(String(userId));
    if (!rounds || rounds.length === 0) return [];
    const history = await Promise.all(
      rounds.map(async (round): Promise<UserPerformanceHistory> => {
        // Null names historically throw before the per-rating fallback. Preserve
        // that malformed-data failure instead of inventing a valid round name.
        const match = round.round_name!.match(/(\d+)/);
        const roundNumber = match ? parseInt(match[1]) : 0;
        const participated = round.participated;
        const actualPoints = parseFloat(String(round.actual_points)) || 0;
        try {
          const rating = await deps.coach(String(userId), String(round.round_id));
          const idealPoints = Math.round(rating?.maxScore || actualPoints);
          const efficiency = calcEfficiency(actualPoints, idealPoints);
          return {
            round_id: round.round_id,
            round_number: roundNumber,
            round_name: round.round_name!,
            actual_points: Math.round(actualPoints),
            ideal_points: idealPoints,
            efficiency: parseFloat(efficiency.toFixed(1)),
            participated,
          };
        } catch (err) {
          console.error(`Error calculating ideal for round ${round.round_id}:`, err);
          return {
            round_id: round.round_id,
            round_number: roundNumber,
            round_name: round.round_name!,
            actual_points: Math.round(actualPoints),
            ideal_points: Math.round(actualPoints),
            efficiency: participated ? 100 : 0,
            participated,
          };
        }
      })
    );
    return history
      .filter((r) => r.round_number > 0)
      .sort((a, b) => a.round_number - b.round_number);
  }
  async function fetchRoundLeaderboard(): Promise<RoundLeaderboardViewModel[]> {
    const users = await deps.managers();
    if (!users || users.length === 0) return [];
    const leaderboard = await Promise.all(
      users.map(async (user) => {
        try {
          const stats = calculateStats(await getUserPerformanceHistoryService(user.id));
          if (!stats) return emptyStats(user.id);
          return {
            userId: user.id,
            avgEfficiency: stats.avgEfficiency,
            totalLost: stats.totalLost,
            bestActual: stats.bestRound?.actual_points || 0,
            bestActualRound: stats.bestRound?.round_number || null,
            worstActual: stats.worstRound?.actual_points || 0,
            worstActualRound: stats.worstRound?.round_number || null,
            bestEfficiency: stats.bestEffRound?.efficiency || 0,
            bestEffRound: stats.bestEffRound?.round_number || null,
            worstEfficiency: stats.worstEffRound?.efficiency || 0,
            worstEffRound: stats.worstEffRound?.round_number || null,
            bestIdeal: stats.bestIdealRound?.ideal_points || 0,
            bestIdealRoundNum: stats.bestIdealRound?.round_number || null,
            maxLost:
              (stats.maxLostRound?.ideal_points || 0) - (stats.maxLostRound?.actual_points || 0),
            maxLostRoundNum: stats.maxLostRound?.round_number || null,
            roundsPlayed: stats.roundsPlayed,
          };
        } catch (err) {
          console.error(`Error fetching stats for user ${user.id}:`, err);
          return emptyStats(user.id);
        }
      })
    );
    return leaderboard.sort((a, b) => parseFloat(b.avgEfficiency) - parseFloat(a.avgEfficiency));
  }
  async function fetchAllUsersPerformanceHistory(): Promise<AllUsersPerformanceHistoryViewModel[]> {
    const users = await deps.managers();
    if (!users) return [];
    return Promise.all(
      users.map(async (user) => {
        try {
          return {
            userId: user.id,
            history: (await getUserPerformanceHistoryService(user.id)) || [],
          };
        } catch (err) {
          console.error(`Error fetching history for user ${user.id}`, err);
          return { userId: user.id, history: [] };
        }
      })
    );
  }
  return {
    getUserPerformanceHistoryService,
    fetchRoundLeaderboard,
    fetchAllUsersPerformanceHistory,
  };
}
function emptyStats(userId: string): RoundLeaderboardViewModel {
  return {
    userId,
    avgEfficiency: '0.0',
    totalLost: 0,
    bestActual: 0,
    bestActualRound: null,
    worstActual: 0,
    worstActualRound: null,
    bestEfficiency: 0,
    bestEffRound: null,
    worstEfficiency: 0,
    worstEffRound: null,
    bestIdeal: 0,
    bestIdealRoundNum: null,
    maxLost: 0,
    maxLostRoundNum: null,
    roundsPlayed: 0,
  };
}
export const {
  getUserPerformanceHistoryService,
  fetchRoundLeaderboard,
  fetchAllUsersPerformanceHistory,
} = createRoundHistoryService({
  history: getUserRoundsHistoryDAO,
  coach: getCoachRating,
  managers: readManagerDirectory,
});
