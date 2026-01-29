/**
 * Compare Service
 * Business logic layer for comparison-related operations
 */

import { db } from '@/lib/db/client';
import { getExtendedStandings as getStandings, getPorrasStats } from '@/lib/db';
import { getUserPerformanceHistoryService } from '@/lib/services/roundsService';
import {
  fetchStreakStats,
  fetchHeatCheckStats,
  fetchHunterStats,
  fetchBottlerStats,
  fetchHeartbreakerStats,
  fetchNoGloryStats,
  fetchJinxStats,
  fetchFloorCeilingStats,
  fetchVolatilityStats,
  fetchEfficiencyStats,
  fetchDominanceStats,
  fetchReliabilityStats,
  fetchTheoreticalGapStats,
  fetchRivalryMatrixStats,
  fetchLeagueComparisonStats,
} from '@/lib/services/standingsService';
import { fetchCaptainStats, fetchHomeAwayStats } from '@/lib/services/dashboardService';

/**
 * Aggregates all necessary data for the comparison page
 * @returns {Promise<Object>} users, history, standings, porras
 */
export async function getComparisonData() {
  const usersQuery = `SELECT id, name, icon, color_index FROM users ORDER BY name ASC`;

  const [
    usersResult,
    standingsData,
    porrasData,
    streakStats,
    heatCheckStats,
    hunterStats,
    bottlerStats,
    heartbreakerStats,
    noGloryStats,
    jinxStats,
    floorCeilingStats,
    volatilityStats,
    efficiencyStats,
    dominanceStats,
    reliabilityStats,
    theoreticalGapStats,
    rivalryMatrixStats,
    leagueComparisonStats,
  ] = await Promise.all([
    db.query(usersQuery),
    getStandings(),
    getPorrasStats(),
    fetchStreakStats(),
    fetchHeatCheckStats(),
    fetchHunterStats(),
    fetchBottlerStats(),
    fetchHeartbreakerStats(),
    fetchNoGloryStats(),
    fetchJinxStats(),
    fetchFloorCeilingStats(),
    fetchVolatilityStats(),
    fetchEfficiencyStats(),
    fetchDominanceStats(),
    fetchReliabilityStats(),
    fetchTheoreticalGapStats(),
    fetchRivalryMatrixStats(),
    fetchLeagueComparisonStats(),
  ]);

  // Fetch full history for each user in parallel using the expert service
  const allUsersHistory = await Promise.all(
    usersResult.rows.map(async (user) => {
      const [history, captain, homeAway] = await Promise.all([
        getUserPerformanceHistoryService(user.id),
        fetchCaptainStats(user.id),
        fetchHomeAwayStats(user.id),
      ]);

      return {
        userId: user.id,
        history,
        captain,
        homeAway,
      };
    })
  );

  // Predictions data is available in 'porrasData' (index 2 of Promise.all)
  // detailed structure fits the new UI requirements

  return {
    users: usersResult.rows,
    history: allUsersHistory,
    standings: standingsData || [],
    porras: porrasData?.porra_stats?.promedios || [], // Backwards compat
    predictions: {
      achievements: porrasData?.achievements || {},
      clutch: porrasData?.clutch_stats || [],
      victorias: porrasData?.porra_stats?.victorias || [],
      promedios: porrasData?.porra_stats?.promedios || [],
      participation: porrasData?.participation || [],
    },
    advancedStats: {
      streaks: streakStats?.streaks || [],
      heatCheck: heatCheckStats || [], // heatCheckStats returns array directly too? checked code: yes .map()
      hunter: hunterStats || [], // getHunterStats returns array
      bottler: bottlerStats || [], // getBottlerStats returns array
      heartbreaker: heartbreakerStats || [], // getHeartbreakerStats returns array
      noGlory: noGloryStats || [], // getNoGloryStats returns array
      jinx: jinxStats || [], // getJinxStats returns array
      floorCeiling: floorCeilingStats || [],
      volatility: volatilityStats || [],
      efficiency: efficiencyStats || [],
      dominance: dominanceStats || [],
      reliability: reliabilityStats || [],
      theoreticalGap: theoreticalGapStats || [],
      rivalryMatrix: rivalryMatrixStats?.matrix || {},
      leagueComparison: leagueComparisonStats || [],
    },
  };
}
