import 'server-only';

/**
 * Compare Service
 * Business logic layer for comparison-related operations
 */

import { db } from '@/lib/db/client';
import { getExtendedStandings as getStandings, getPorrasStats } from '@/lib/db';
import { getUserPerformanceHistoryService } from '@/lib/services/core/roundsService';

/**
 * Helper: Get User Squad (Inlined to avoid circular dependency issues)
 */
async function getUserSquad(userId) {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.position,
      t.name as team,
      p.price,
      COALESCE(SUM(prs.fantasy_points), 0) as points,
      ROUND(AVG(COALESCE(prs.fantasy_points, 0)), 1) as average,
      p.status
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id
    WHERE p.owner_id = $1
    GROUP BY p.id, p.name, p.position, t.name, p.price, p.status
    ORDER BY points DESC
  `;

  const rows = (await db.query(query, [userId])).rows;
  return rows.map((row) => ({
    ...row,
    average: parseFloat(row.average) || 0,
    points: parseInt(row.points) || 0,
    price: parseInt(row.price) || 0,
  }));
}
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
} from '@/lib/services/app/standingsService';
import { fetchCaptainStats, fetchHomeAwayStats } from '@/lib/services/app/dashboardService';

/**
 * Aggregates all necessary data for the comparison page
 * @returns {Promise<Object>} users, history, standings, porras
 */
export async function getCompareData() {
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
      const [history, captain, homeAway, squad] = await Promise.all([
        getUserPerformanceHistoryService(user.id),
        fetchCaptainStats(user.id),
        fetchHomeAwayStats(user.id),
        getUserSquad(user.id),
      ]);

      // Calculate Squad Stats
      const validSquad = squad.filter((p) => p.points > 0);
      const avgPlayerPoints =
        validSquad.length > 0
          ? validSquad.reduce((sum, p) => sum + p.points, 0) / validSquad.length
          : 0;

      const bestPlayer = squad.length > 0 ? squad[0] : null; // squad is ordered by points DESC in query

      return {
        userId: user.id,
        history,
        captain,
        homeAway,
        squadStats: {
          avgPlayerPoints,
          bestPlayer: bestPlayer
            ? { name: bestPlayer.name, points: bestPlayer.points }
            : { name: '-', points: 0 },
        },
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
      streaks: streakStats || [],
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
