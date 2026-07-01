import 'server-only';

/**
 * Compare Service
 * Business logic layer for comparison-related operations
 */

import { db } from '../../db/client';
import { resolveReadSeasonId } from '../../db/season-context';
import {
  getExtendedStandings as getStandings,
  getPorrasStats,
  getManagerMarketStats,
  getBestSeller,
  getBiddingDuelsStats,
  getTheThief,
} from '../../db';
import { getUserPerformanceHistoryService } from '../core/roundsService';
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
} from '../app/standingsService';
import { fetchCaptainStats, fetchHomeAwayStats } from '../app/dashboardService';

export interface UserSquadMember {
  id: number;
  name: string;
  position: string;
  team: string;
  price: number;
  points: number;
  average: number;
  status: string;
}

/**
 * Helper: Get User Squad (Inlined to avoid circular dependency issues)
 */
async function getUserSquad(userId: number): Promise<UserSquadMember[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT 
      p.id,
      p.name,
      p.position,
      t.name as team,
      COALESCE(ps.price, p.price) AS price,
      COALESCE(SUM(prs.fantasy_points), 0) as points,
      ROUND(AVG(COALESCE(prs.fantasy_points, 0)), 1) as average,
      COALESCE(ps.status, p.status) AS status
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id AND prs.season_id = ps.season_id
    WHERE ps.season_id = $2 AND ps.owner_id = $1
    GROUP BY p.id, p.name, p.position, t.name, ps.price, p.price, ps.status, p.status
    ORDER BY points DESC
  `;

  const rows = (await db.query(query, [userId, seasonId])).rows;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    position: row.position,
    team: row.team,
    status: row.status,
    average: parseFloat(row.average) || 0,
    points: parseInt(row.points) || 0,
    price: parseInt(row.price) || 0,
  }));
}

export interface CompareDataResponse {
  users: any[];
  history: any[];
  standings: any[];
  porras: any[];
  predictions: {
    achievements: any;
    clutch: any[];
    victorias: any[];
    promedios: any[];
    participation: any[];
  };
  advancedStats: {
    streaks: any[];
    heatCheck: any[];
    hunter: any[];
    bottler: any[];
    heartbreaker: any[];
    noGlory: any[];
    jinx: any[];
    floorCeiling: any[];
    volatility: any[];
    efficiency: any[];
    dominance: any[];
    reliability: any[];
    theoreticalGap: any[];
    rivalryMatrix: any;
    leagueComparison: any[];
    market: any[];
    bestSeller: any[];
    biddingDuels: any;
    theThief: any[];
  };
}

export interface CompareDataLiteResponse {
  users: any[];
  history: any[];
  standings: any[];
  porras: any[];
  predictions: {
    achievements: any;
    clutch: any[];
    victorias: any[];
    promedios: any[];
    participation: any[];
  };
}

/**
 * Aggregates all necessary data for the comparison page
 * @returns users, history, standings, porras
 */
export async function getCompareData(): Promise<CompareDataResponse> {
  const seasonId = await resolveReadSeasonId();
  const usersQuery = `
    SELECT u.id, COALESCE(us.name, u.name) as name, COALESCE(us.icon, u.icon) as icon, COALESCE(us.color_index, u.color_index, 0) as color_index
    FROM user_seasons us
    JOIN users u ON u.id = us.user_id
    WHERE us.season_id = $1 AND COALESCE(us.status, 'active') <> 'inactive'
    ORDER BY COALESCE(us.name, u.name) ASC
  `;

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
    managerMarketStats,
    bestSellerStats,
    biddingDuelsStats,
    theThiefStats,
  ] = await Promise.all([
    db.query(usersQuery, [seasonId]),
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
    getManagerMarketStats(),
    getBestSeller(),
    getBiddingDuelsStats(),
    getTheThief(),
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
      heatCheck: heatCheckStats || [],
      hunter: hunterStats || [],
      bottler: bottlerStats || [],
      heartbreaker: heartbreakerStats || [],
      noGlory: noGloryStats || [],
      jinx: jinxStats || [],
      floorCeiling: floorCeilingStats || [],
      volatility: volatilityStats || [],
      efficiency: efficiencyStats || [],
      dominance: dominanceStats || [],
      reliability: reliabilityStats || [],
      theoreticalGap: theoreticalGapStats || [],
      rivalryMatrix: rivalryMatrixStats?.matrix || {},
      leagueComparison: leagueComparisonStats || [],
      market: managerMarketStats || [],
      bestSeller: bestSellerStats || [],
      biddingDuels: biddingDuelsStats || { matrix: {}, summaries: [] },
      theThief: theThiefStats || [],
    },
  };
}

/**
 * Lightweight version of getCompareData - returns only essential data
 * Excludes all advanced statistics for faster initial page load
 * @returns users, history, standings, porras, predictions (no advanced stats)
 */
export async function getCompareDataLite(): Promise<CompareDataLiteResponse> {
  const seasonId = await resolveReadSeasonId();
  const usersQuery = `
    SELECT u.id, COALESCE(us.name, u.name) as name, COALESCE(us.icon, u.icon) as icon, COALESCE(us.color_index, u.color_index, 0) as color_index
    FROM user_seasons us
    JOIN users u ON u.id = us.user_id
    WHERE us.season_id = $1 AND COALESCE(us.status, 'active') <> 'inactive'
    ORDER BY COALESCE(us.name, u.name) ASC
  `;

  const [usersResult, standingsData, porrasData] = await Promise.all([
    db.query(usersQuery, [seasonId]),
    getStandings(),
    getPorrasStats(),
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

  return {
    users: usersResult.rows,
    history: allUsersHistory,
    standings: standingsData || [],
    porras: porrasData?.porra_stats?.promedios || [],
    predictions: {
      achievements: porrasData?.achievements || {},
      clutch: porrasData?.clutch_stats || [],
      victorias: porrasData?.porra_stats?.victorias || [],
      promedios: porrasData?.porra_stats?.promedios || [],
      participation: porrasData?.participation || [],
    },
  };
}
