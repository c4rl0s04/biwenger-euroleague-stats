/**
 * Advanced Statistics Queries
 * Complex analytics for the standings page
 */

import { db } from '../../client';
import { cached, CACHE_TTL } from '../../../utils/cache';

export interface HeatCheckStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  last5_avg: number;
  season_avg: number;
  diff: number;
  status: 'fire' | 'ice' | 'neutral';
}

export interface HunterStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  recent_points: number;
  gained: number;
}

export interface RollingAverageStat {
  user_id: number;
  name: string;
  color_index: number;
  data: {
    round: number;
    round_name: string;
    avg: number;
  }[];
}

export interface FloorCeilingStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  floor: number;
  ceiling: number;
  avg: number;
}

export interface ReliabilityStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  total_rounds: number;
  rounds_above: number;
  pct: number;
}

export interface PointDistributionStat {
  user_id: number;
  name: string;
  color_index: number;
  distribution: {
    [range: string]: number; // '90-135' | '136-170' | ...
  };
}

export interface PlayAllStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  wins: number;
  losses: number;
  ties: number;
  pct: number;
}

export interface DominanceStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  wins: number;
  avg_margin: number;
}

export interface TheoreticalGapStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  current_points: number;
  perfectTotal: number;
  gap: number;
  pct: number;
}

export interface HeatmapStat {
  rounds: { id: number; name: string }[];
  users: {
    id: number;
    name: string;
    icon: string;
    color_index: number;
    scores: (number | null)[];
  }[];
}

export interface PositionChangeStat {
  rounds: { id: number; name: string }[];
  users: {
    id: number;
    name: string;
    icon: string;
    color_index: number;
    history: { position: number; change: number }[];
  }[];
  valid: boolean;
  stats: {
    biggestClimber: { name: string; change: number; round: string };
    biggestFaller: { name: string; change: number; round: string };
  };
}

export interface RivalryMatrixStat {
  users: {
    id: number;
    name: string;
    icon: string;
    color_index: number;
  }[];
  matrix: {
    [userId: number]: {
      [opponentId: number]: { wins: number; losses: number; ties: number };
    };
  };
}

export interface CaptainStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  total_captains: number;
  raw_captain_points: number;
  total_bonus: number;
  weighted_points: number;
  avg_captain_points: number;
}

/**
 * Get Heat Check Stats
 * Compares average points in last 5 rounds vs season average
 */
export async function getHeatCheckStats(): Promise<HeatCheckStat[]> {
  try {
    const sql = `
      WITH UserParticipation AS (
        SELECT 
          user_id,
          points,
          ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY round_id DESC) as rn
        FROM user_rounds
        WHERE participated = TRUE
      ),
      RecentStats AS (
        SELECT 
          user_id,
          SUM(points) / 5.0 as recent_avg
        FROM UserParticipation
        WHERE rn <= 5
        GROUP BY user_id
      ),
      SeasonStats AS (
        SELECT 
          user_id, 
          CAST(SUM(points) AS NUMERIC) / COUNT(*) as season_avg
        FROM user_rounds
        WHERE participated = TRUE
        GROUP BY user_id
      )
      SELECT 
        u.id as user_id, 
        u.name, 
        u.icon,
        u.color_index,
        COALESCE(r.recent_avg, 0) as last5_avg,
        COALESCE(s.season_avg, 0) as season_avg,
        (COALESCE(r.recent_avg, 0) - COALESCE(s.season_avg, 0)) as diff
      FROM users u
      JOIN SeasonStats s ON u.id = s.user_id
      LEFT JOIN RecentStats r ON u.id = r.user_id
      ORDER BY diff DESC
    `;

    return (await db.query(sql)).rows.map((stat: any) => ({
      ...stat,
      last5_avg: parseFloat(stat.last5_avg) || 0,
      season_avg: parseFloat(stat.season_avg) || 0,
      diff: parseFloat(stat.diff) || 0,
      status: stat.diff > 10 ? 'fire' : stat.diff < -10 ? 'ice' : 'neutral',
    }));
  } catch (error) {
    console.error('Error in getHeatCheckStats:', error);
    return [];
  }
}

/**
 * Get "The Hunter" Stats
 * Points gained/lost vs leader in last 5 rounds
 */
export async function getHunterStats(): Promise<HunterStat[]> {
  try {
    // Get current leader ID
    const extendedStandings = (
      await db.query(`
      SELECT user_id, SUM(points) as total 
      FROM user_rounds 
      GROUP BY user_id 
      ORDER BY total DESC 
      LIMIT 1
    `)
    ).rows[0];

    if (!extendedStandings) return [];
    const leaderId = extendedStandings.user_id;

    // Get last 5 rounds
    const rounds = (
      await db.query('SELECT DISTINCT round_id FROM user_rounds ORDER BY round_id DESC LIMIT 5')
    ).rows;
    if (rounds.length === 0) return [];
    const minRoundId = rounds[rounds.length - 1].round_id;

    const sql = `
      SELECT 
        u.id as user_id, 
        u.name, 
        u.icon, 
        u.color_index,
        SUM(ur.points) as recent_points
      FROM users u
      JOIN user_rounds ur ON u.id = ur.user_id
      WHERE ur.round_id >= $1
      GROUP BY u.id
    `;

    const recentPoints = (await db.query(sql, [minRoundId])).rows.map((p: any) => ({
      ...p,
      recent_points: parseInt(p.recent_points) || 0,
    }));
    const leaderStats = recentPoints.find((p: any) => p.user_id === leaderId);

    if (!leaderStats) return [];

    return recentPoints
      .filter((p: any) => p.user_id !== leaderId)
      .map((p: any) => ({
        ...p,
        gained: p.recent_points - leaderStats.recent_points,
      }))
      .sort((a: any, b: any) => b.gained - a.gained);
  } catch (error) {
    console.error('Error in getHunterStats:', error);
    return [];
  }
}

/**
 * Get Rolling Average (3 rounds)
 */
export async function getRollingAverageStats(): Promise<RollingAverageStat[]> {
  try {
    const rounds = (
      await db.query('SELECT DISTINCT round_id, round_name FROM user_rounds ORDER BY round_id ASC')
    ).rows;
    const users = (await db.query('SELECT id, name, color_index FROM users')).rows;

    const result: RollingAverageStat[] = [];

    // Calculate rolling avg for each user
    for (const user of users) {
      const userPoints = (
        await db.query(
          `
        SELECT round_id, points 
        FROM user_rounds 
        WHERE user_id = $1 
        ORDER BY round_id ASC
      `,
          [user.id]
        )
      ).rows;

      const dataPoints = [];

      for (let i = 0; i < userPoints.length; i++) {
        // Get window of current + previous 2 rounds
        const window = userPoints.slice(Math.max(0, i - 2), i + 1);
        const sum = window.reduce((acc: number, curr: any) => acc + curr.points, 0);
        const avg = sum / window.length;

        // Find round name from pre-fetched rounds array
        const roundInfo = rounds.find((r: any) => r.round_id === userPoints[i].round_id);
        const roundName = roundInfo ? roundInfo.round_name : `Jornada ${userPoints[i].round_id}`;

        dataPoints.push({
          round: userPoints[i].round_id,
          round_name: roundName,
          avg: parseFloat(avg.toFixed(1)),
        });
      }

      result.push({
        user_id: user.id,
        name: user.name,
        color_index: user.color_index,
        data: dataPoints,
      });
    }

    return result;
  } catch (error) {
    console.error('Error in getRollingAverageStats:', error);
    return [];
  }
}

/**
 * Get Floor & Ceiling Stats
 */
export async function getFloorCeilingStats(): Promise<FloorCeilingStat[]> {
  try {
    const sql = `
      SELECT 
        u.id as user_id, 
        u.name, 
        u.icon, 
        u.color_index,
        MIN(ur.points) as floor,
        MAX(ur.points) as ceiling,
        CAST(AVG(ur.points) as INTEGER) as avg
      FROM users u
      JOIN user_rounds ur ON u.id = ur.user_id
      WHERE ur.participated = TRUE
      GROUP BY u.id
      ORDER BY ceiling DESC
    `;

    return (await db.query(sql)).rows.map((row: any) => ({
      ...row,
      floor: parseInt(row.floor) || 0,
      ceiling: parseInt(row.ceiling) || 0,
      avg: parseInt(row.avg) || 0,
    }));
  } catch (error) {
    console.error('Error in getFloorCeilingStats:', error);
    return [];
  }
}

/**
 * Get Reliability Stats (% Rounds > Average)
 */
export async function getReliabilityStats(): Promise<ReliabilityStat[]> {
  try {
    // 1. Calculate Average per Round
    const roundAvgs = (
      await db.query(`
      SELECT round_id, AVG(points) as avg_pts
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY round_id
    `)
    ).rows;

    const roundAvgMap: Record<number, number> = {};
    roundAvgs.forEach((r: any) => (roundAvgMap[r.round_id] = parseFloat(r.avg_pts) || 0));

    // 2. Get all User Scores
    const userScores = (
      await db.query(`
      SELECT 
        u.id as user_id,
        u.name,
        u.icon,
        u.color_index,
        ur.round_id,
        ur.points
      FROM users u
      JOIN user_rounds ur ON u.id = ur.user_id
      WHERE ur.participated = TRUE
    `)
    ).rows;

    // 3. Aggregate
    const userStats: Record<number, any> = {};
    userScores.forEach((score: any) => {
      if (!userStats[score.user_id]) {
        userStats[score.user_id] = {
          user_id: score.user_id,
          name: score.name,
          icon: score.icon,
          color_index: score.color_index,
          total_rounds: 0,
          rounds_above: 0,
        };
      }

      const avg = roundAvgMap[score.round_id] || 0;
      userStats[score.user_id].total_rounds++;
      if (score.points > avg) {
        userStats[score.user_id].rounds_above++;
      }
    });

    return Object.values(userStats)
      .map((u: any) => ({
        ...u,
        pct: u.total_rounds > 0 ? (u.rounds_above / u.total_rounds) * 100 : 0,
      }))
      .sort((a: any, b: any) => b.pct - a.pct);
  } catch (error) {
    console.error('Error in getReliabilityStats:', error);
    return [];
  }
}

/**
 * Get Point Distribution (Histogram)
 */
export async function getPointDistributionStats(): Promise<PointDistributionStat[]> {
  try {
    const users = (await db.query('SELECT id, name, color_index FROM users')).rows;
    const buckets = [
      { range: '90-135', min: 90, max: 135 },
      { range: '136-170', min: 136, max: 170 },
      { range: '171-205', min: 171, max: 205 },
      { range: '206+', min: 206, max: 9999 },
    ];

    const result: PointDistributionStat[] = [];

    for (const user of users) {
      const distribution: Record<string, number> = {};
      buckets.forEach((b) => (distribution[b.range] = 0));

      const rounds = (
        await db.query(
          'SELECT points FROM user_rounds WHERE user_id = $1 AND participated = TRUE',
          [user.id]
        )
      ).rows;

      rounds.forEach((r: any) => {
        const p = r.points;
        if (p <= 135) distribution['90-135']++;
        else if (p <= 170) distribution['136-170']++;
        else if (p <= 205) distribution['171-205']++;
        else distribution['206+']++;
      });

      result.push({
        user_id: user.id,
        name: user.name,
        color_index: user.color_index,
        distribution,
      });
    }

    return result;
  } catch (error) {
    console.error('Error in getPointDistributionStats:', error);
    return [];
  }
}

/**
 * Get All-Play-All Record (Virtual League)
 * CACHED: This is an O(n * m²) operation, cache for 15 minutes
 */
export async function getAllPlayAllStats(): Promise<PlayAllStat[]> {
  return cached('advanced:all-play-all', CACHE_TTL.LONG, async () => {
    try {
      // Get all rounds
      const rounds = (
        await db.query('SELECT DISTINCT round_id FROM user_rounds WHERE participated = TRUE')
      ).rows;
      const users = (await db.query('SELECT id, name, icon, color_index FROM users')).rows;

      const standings: Record<number, any> = {};
      users.forEach((u: any) => {
        standings[u.id] = {
          user_id: u.id,
          name: u.name,
          icon: u.icon,
          color_index: u.color_index,
          wins: 0,
          losses: 0,
          ties: 0,
        };
      });

      for (const round of rounds) {
        const roundScores = (
          await db.query('SELECT user_id, points FROM user_rounds WHERE round_id = $1', [
            round.round_id,
          ])
        ).rows;

        // Compare everyone against everyone
        for (let i = 0; i < roundScores.length; i++) {
          for (let j = i + 1; j < roundScores.length; j++) {
            const u1 = roundScores[i];
            const u2 = roundScores[j];

            // Safety check: ensure both users exist in our reference list
            if (!standings[u1.user_id] || !standings[u2.user_id]) continue;

            if (u1.points > u2.points) {
              standings[u1.user_id].wins++;
              standings[u2.user_id].losses++;
            } else if (u2.points > u1.points) {
              standings[u2.user_id].wins++;
              standings[u1.user_id].losses++;
            } else {
              standings[u1.user_id].ties++;
              standings[u2.user_id].ties++;
            }
          }
        }
      }

      return Object.values(standings)
        .map((s: any) => ({
          ...s,
          pct: (s.wins / (s.wins + s.losses + s.ties)) * 100,
        }))
        .sort((a: any, b: any) => b.pct - a.pct);
    } catch (error) {
      console.error('Error in getAllPlayAllStats:', error);
      return [];
    }
  });
}

/**
 * Get Dominance Stats (Margin of Victory)
 */
export async function getDominanceStats(): Promise<DominanceStat[]> {
  try {
    const result = (
      await db.query(`
      WITH RoundWinners AS (
        SELECT 
          round_id,
          user_id,
          points,
          RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as rnk
        FROM user_rounds
        WHERE participated = TRUE
      )
      SELECT 
        w.user_id,
        u.name,
        u.icon,
        u.color_index,
        COUNT(*) as wins,
        AVG(w.points - runner.points) as avg_margin
      FROM RoundWinners w
      JOIN RoundWinners runner ON w.round_id = runner.round_id AND runner.rnk = 2
      JOIN users u ON w.user_id = u.id
      WHERE w.rnk = 1
      GROUP BY w.user_id, u.name, u.icon, u.color_index
      ORDER BY avg_margin DESC
    `)
    ).rows;

    return result.map((row: any) => ({
      ...row,
      wins: parseInt(row.wins) || 0,
      avg_margin: parseFloat(row.avg_margin) || 0,
    }));
  } catch (error) {
    console.error('Error in getDominanceStats:', error);
    return [];
  }
}

/**
 * Get Theoretical Gap Stats (Distance from perfect season)
 */
export async function getTheoreticalGapStats(): Promise<TheoreticalGapStat[]> {
  try {
    // Calculate Perfect Season Total
    const perfectTotalResult = (
      await db.query(`
      WITH MaxPoints AS (
        SELECT MAX(points) as max_pts FROM user_rounds GROUP BY round_id
      )
      SELECT SUM(max_pts) as total FROM MaxPoints
    `)
    ).rows[0];

    if (!perfectTotalResult || perfectTotalResult.total === null) return [];
    const perfectTotal = parseInt(perfectTotalResult.total) || 0;

    // Get User Totals
    const userTotals = (
      await db.query(`
      SELECT 
        u.id as user_id,
        u.name,
        u.icon,
        u.color_index,
        SUM(ur.points) as current_points
      FROM user_rounds ur
      JOIN users u ON ur.user_id = u.id
      WHERE participated = TRUE
      GROUP BY u.id
    `)
    ).rows;

    return userTotals
      .map((u: any) => {
        const current_points = parseInt(u.current_points) || 0;
        return {
          ...u,
          current_points,
          perfectTotal,
          gap: perfectTotal - current_points,
          pct: (current_points / perfectTotal) * 100,
        };
      })
      .sort((a: any, b: any) => a.gap - b.gap); // Smallest gap is best
  } catch (error) {
    console.error('Error in getTheoreticalGapStats:', error);
    return [];
  }
}

/**
 * Get Round-by-Round Heatmap Stats
 * CACHED: Aggregates all scores, cache for 15 minutes
 */
export async function getHeatmapStats(): Promise<HeatmapStat> {
  return cached('advanced:heatmap', CACHE_TTL.LONG, async () => {
    try {
      // Get all rounds to ensure column structure
      const rounds = (
        await db.query(
          'SELECT DISTINCT round_id, round_name FROM user_rounds ORDER BY round_id ASC'
        )
      ).rows;

      // Get all users
      const users = (await db.query('SELECT id, name, icon, color_index FROM users')).rows;

      // Get all scores
      const scores = (
        await db.query(`
      SELECT user_id, round_id, points 
      FROM user_rounds 
      WHERE participated = TRUE
    `)
      ).rows;

      // Map scores for O(1) access: scoreMap[userId][roundId] = points
      const scoreMap: Record<number, Record<number, number>> = {};
      scores.forEach((s: any) => {
        if (!scoreMap[s.user_id]) scoreMap[s.user_id] = {};
        scoreMap[s.user_id][s.round_id] = s.points;
      });

      // Build grid
      return {
        rounds: rounds.map((r: any) => ({
          id: r.round_id,
          name: r.round_name.replace('Jornada ', 'J'),
        })),
        users: users.map((u: any) => ({
          id: u.id,
          name: u.name,
          icon: u.icon,
          color_index: u.color_index,
          scores: rounds.map((r: any) => scoreMap[u.id]?.[r.round_id] ?? null),
        })),
      };
    } catch (error) {
      console.error('Error in getHeatmapStats:', error);
      return { rounds: [], users: [] };
    }
  });
}

/**
 * Get Position Changes Stats (Evolution Heatmap)
 * Tracks rank changes round-by-round
 * CACHED: Replays entire season history, cache for 15 minutes
 */
export async function getPositionChangesStats(): Promise<PositionChangeStat> {
  return cached('advanced:position-changes', CACHE_TTL.LONG, async () => {
    try {
      const rounds = (
        await db.query(
          'SELECT DISTINCT round_id, round_name FROM user_rounds ORDER BY round_id ASC'
        )
      ).rows;
      const users = (await db.query('SELECT id, name, icon, color_index FROM users')).rows;
      // Get all scores ordered by round
      const scores = (
        await db.query(
          'SELECT user_id, round_id, points FROM user_rounds WHERE participated = TRUE ORDER BY round_id ASC'
        )
      ).rows;

      // Map scores by round: roundScores[roundId][userId] = points
      const roundScores: Record<number, Record<number, number>> = {};
      scores.forEach((s: any) => {
        if (!roundScores[s.round_id]) roundScores[s.round_id] = {};
        roundScores[s.round_id][s.user_id] = s.points;
      });

      // Tracking state
      const userTotals: Record<number, number> = {}; // { userId: currentTotal }
      users.forEach((u: any) => (userTotals[u.id] = 0));

      const history: {
        round_id: number;
        round_name: string;
        ranks: Record<number, number>;
      }[] = [];

      // Replay history
      for (const round of rounds) {
        // update totals
        const currentRoundScores = roundScores[round.round_id] || {};
        users.forEach((u: any) => {
          userTotals[u.id] += currentRoundScores[u.id] || 0;
        });

        // calculate ranks for this round
        // sort users by total points desc
        const sortedUsers = [...users].sort(
          (a: any, b: any) => userTotals[b.id] - userTotals[a.id]
        );

        const currentRanks: Record<number, number> = {};
        sortedUsers.forEach((u: any, index: number) => {
          currentRanks[u.id] = index + 1;
        });

        history.push({
          round_id: round.round_id,
          round_name: round.round_name,
          ranks: currentRanks,
        });
      }

      // specific stats
      let biggestClimber = { name: '', change: 0, round: '' };
      let biggestFaller = { name: '', change: 0, round: '' };

      // Format output: evolutions per user
      const usersEvolution = users.map((user: any) => {
        const historyData = history.map((h, index) => {
          const currRank = h.ranks[user.id];

          if (index === 0) {
            return { position: currRank, change: 0 };
          }

          const prevRank = history[index - 1].ranks[user.id];

          // If rank decreases (e.g. 5 -> 3), it's a climb (positive change)
          const change = prevRank - currRank;

          // Update records (only if there is a change)
          if (change > biggestClimber.change)
            biggestClimber = { name: user.name, change, round: h.round_name };
          if (change < biggestFaller.change)
            biggestFaller = { name: user.name, change, round: h.round_name };

          return { position: currRank, change };
        });

        return {
          id: user.id,
          name: user.name,
          icon: user.icon,
          color_index: user.color_index,
          history: historyData,
        };
      });

      return {
        rounds: rounds.map((r: any) => ({
          id: r.round_id,
          name: r.round_name.replace('Jornada ', 'J'),
        })),
        users: usersEvolution,
        valid: rounds.length > 1,
        stats: { biggestClimber, biggestFaller },
      };
    } catch (error) {
      console.error('Error in getPositionChangesStats:', error);
      return {
        rounds: [],
        users: [],
        valid: false,
        stats: {
          biggestClimber: { name: '', change: 0, round: '' },
          biggestFaller: { name: '', change: 0, round: '' },
        },
      };
    }
  });
}

/**
 * Get Rivalry Matrix Stats
 * Head-to-Head record for every user pair
 * CACHED: O(n * m²) operation, cache for 15 minutes
 */
export async function getRivalryMatrixStats(): Promise<RivalryMatrixStat> {
  return cached('advanced:rivalry-matrix', CACHE_TTL.LONG, async () => {
    try {
      const users = (await db.query('SELECT id, name, icon, color_index FROM users')).rows;
      const rounds = (
        await db.query('SELECT DISTINCT round_id FROM user_rounds WHERE participated = TRUE')
      ).rows;

      // Initialize matrix
      // Structure: { [userId]: { [opponentId]: { wins: 0, losses: 0, ties: 0 } } }
      const matrix: Record<number, Record<number, any>> = {};
      users.forEach((u: any) => {
        matrix[u.id] = {};
        users.forEach((opp: any) => {
          if (u.id !== opp.id) {
            matrix[u.id][opp.id] = { wins: 0, losses: 0, ties: 0 };
          }
        });
      });

      for (const round of rounds) {
        const roundScores = (
          await db.query(
            'SELECT user_id, points FROM user_rounds WHERE round_id = $1 AND participated = TRUE',
            [round.round_id]
          )
        ).rows;

        // Compare everyone against everyone
        for (let i = 0; i < roundScores.length; i++) {
          for (let j = i + 1; j < roundScores.length; j++) {
            const u1 = roundScores[i];
            const u2 = roundScores[j];

            // Ensure both users exist in our matrix (safety check)
            if (!matrix[u1.user_id] || !matrix[u2.user_id]) continue;

            if (u1.points > u2.points) {
              matrix[u1.user_id][u2.user_id].wins++;
              matrix[u2.user_id][u1.user_id].losses++;
            } else if (u2.points > u1.points) {
              matrix[u2.user_id][u1.user_id].wins++;
              matrix[u1.user_id][u2.user_id].losses++;
            } else {
              matrix[u1.user_id][u2.user_id].ties++;
              matrix[u2.user_id][u1.user_id].ties++;
            }
          }
        }
      }

      return {
        users: users.map((u: any) => ({
          id: u.id,
          name: u.name,
          icon: u.icon,
          color_index: u.color_index,
        })),
        matrix,
      };
    } catch (error) {
      console.error('Error in getRivalryMatrixStats:', error);
      return { users: [], matrix: {} };
    }
  });
}

/**
 * Get Captain Fantastic Stats
 * Best performing captains
 */
export async function getCaptainStats(): Promise<CaptainStat[]> {
  try {
    const sql = `
      SELECT 
        l.user_id,
        u.name,
        u.icon,
        u.color_index,
        COUNT(*) as total_captains,
        SUM(prs.points) as raw_captain_points,
        SUM(CASE 
          WHEN prs.fantasy_points IS NOT NULL THEN prs.fantasy_points 
          ELSE prs.points * 2 
        END) as weighted_points,
        AVG(prs.points) as avg_captain_points
      FROM lineups l
      JOIN users u ON l.user_id = u.id
      JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
      WHERE l.is_captain = TRUE
      GROUP BY l.user_id, u.name, u.icon, u.color_index
      ORDER BY raw_captain_points DESC
    `;

    return (await db.query(sql)).rows.map((u: any) => ({
      ...u,
      total_bonus: parseInt(u.raw_captain_points) || 0,
      avg_captain_points: parseFloat(u.avg_captain_points) || 0,
      weighted_points: parseInt(u.weighted_points) || 0,
      total_captains: parseInt(u.total_captains) || 0,
    }));
  } catch (error) {
    console.error('Error in getCaptainStats:', error);
    return [];
  }
}
