import 'server-only';
import {
  getFullStandings,
  getLeagueOverview,
  fetchValueRanking,
  fetchRoundWinners,
  fetchPointsProgression,
  fetchStreakStats,
  fetchPlacementStats,
  fetchBottlerStats,
  fetchHeartbreakerStats,
  fetchNoGloryStats,
  fetchJinxStats,
  fetchEfficiencyStats,
  fetchDetailedCaptainStats,
  fetchVolatilityStats,
  fetchHeatCheckStats,
  fetchHunterStats,
  fetchRollingAverageStats,
  fetchFloorCeilingStats,
  fetchPointDistributionStats,
  fetchDominanceStats,
  fetchPositionChangesStats,
  fetchReliabilityStats,
  fetchTheoreticalGapStats,
  fetchLeagueComparisonStats,
  fetchRivalryMatrixStats,
  fetchHeatmapStats,
  fetchTheoreticalStandings,
  fetchInitialSquadAnalytics,
  fetchInitialSquadStats,
} from '@/features/standings/server';
import {
  getExtendedStandings,
  getSimpleStandings,
  getLeaderComparison,
  getLeagueAveragePoints,
} from '../../db/queries/competition/standings';
import { getAllPlayAllStats } from '../../db/queries/analytics/advanced_stats';
import { getWinCounts } from '../../db/queries/competition/standings';

// Re-export standard APIs
export {
  getFullStandings,
  getLeagueOverview,
  fetchValueRanking,
  fetchRoundWinners,
  fetchPointsProgression,
  fetchStreakStats,
  fetchPlacementStats,
  fetchBottlerStats,
  fetchHeartbreakerStats,
  fetchNoGloryStats,
  fetchJinxStats,
  fetchEfficiencyStats,
  fetchDetailedCaptainStats,
  fetchVolatilityStats,
  fetchHeatCheckStats,
  fetchHunterStats,
  fetchRollingAverageStats,
  fetchFloorCeilingStats,
  fetchPointDistributionStats,
  fetchDominanceStats,
  fetchPositionChangesStats,
  fetchReliabilityStats,
  fetchTheoreticalGapStats,
  fetchLeagueComparisonStats,
  fetchRivalryMatrixStats,
  fetchHeatmapStats,
  fetchTheoreticalStandings,
  fetchInitialSquadAnalytics,
  fetchInitialSquadStats,
  getAllPlayAllStats as fetchAllPlayAllStats,
};

export interface StandingsOptions {
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export interface StandingsPageOptions {
  roundsLimit?: number;
  progressionLimit?: number;
}

export async function getStandingsPageData(options: StandingsPageOptions = {}) {
  const { roundsLimit = 15, progressionLimit = 10 } = options;

  const [standings, leagueTotals, roundWinners, pointsProgression, valueRanking, winCounts] =
    await Promise.all([
      getExtendedStandings(),
      getLeagueOverview(),
      fetchRoundWinners(roundsLimit),
      fetchPointsProgression(progressionLimit),
      fetchValueRanking(),
      getWinCounts(),
    ]);

  return {
    standings,
    leagueTotals,
    roundWinners,
    pointsProgression,
    valueRanking,
    winCounts,
  };
}

export async function getUserPositionData(userId: string | number) {
  const standings = await getExtendedStandings();
  const userIndex = standings.findIndex((u: any) => String(u.user_id) === String(userId));

  if (userIndex === -1) {
    return { found: false, position: null, gap: null };
  }

  const user = standings[userIndex] as any;
  const leader = standings[0] as any;

  return {
    found: true,
    position: user.position,
    totalPoints: user.total_points,
    gapToLeader: leader.total_points - user.total_points,
    gapToNext:
      userIndex > 0 ? (standings[userIndex - 1] as any).total_points - user.total_points : 0,
    leadOverNext:
      userIndex < standings.length - 1
        ? user.total_points - (standings[userIndex + 1] as any).total_points
        : 0,
    leader: { name: leader.name, totalPoints: leader.total_points },
  };
}
