import 'server-only';
import { db, pgClient } from '@/lib/db/connection';
import { matches } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import {
  inferGhostPosition,
  calculateWeightedSum,
  selectOptimalSquad,
} from '../round-analysis.logic';
import { calcEfficiency } from '@/lib/utils/efficiency';
import { selectIdealLineup } from '@/lib/logic/ideal-lineup';
import type {
  RoundOptionRow,
  LineupRow,
  LineupPlayer,
  UserLineup,
  LineupTotalsRow,
  StandingRow,
  RoundStanding,
  MvpRow,
  StatLeaderRow,
  WinnerRow,
  RoundGlobalStats,
  SquadPlayerRow,
  OptimizationPlayerRow,
  IdealPlayerRow,
  IdealLineupResult,
  OptimizationResult,
  RoundHistoryRow,
  LineupUsageResult,
  CoachRating,
} from '../../models/round-query-contracts';
/**
 * Get all rounds available in the system
 */
export async function getAllRounds(): Promise<RoundOptionRow[]> {
  const seasonId = await resolveReadSeasonId();
  return await db
    .select({
      round_id: matches.roundId,
      round_name: matches.roundName,
    })
    .from(matches)
    .where(eq(matches.seasonId, seasonId))
    .groupBy(matches.roundId, matches.roundName)
    .orderBy(desc(matches.roundId));
}

/**
 * Get user lineup for a specific round
 * Includes dynamic calculation of missing player stats (players who left competition)
 */
export async function getUserLineup(userId: string, roundId: string | number): Promise<UserLineup> {
  const seasonId = await resolveReadSeasonId();
  // 1. Get detailed lineup stats
  const query = `
    SELECT
      l.player_id,
      COALESCE(p.name, 'Unknown Player') as name,
      COALESCE(p.position, 'Bench') as position,
      p.img,
      COALESCE(t.name, 'Unknown Team') as team,
      t.short_name as team_short,
      t.img as team_img,
      l.is_captain,
      l.role,
      prs.fantasy_points as raw_points,
      COALESCE(prs.valuation, 0) as valuation,
      COALESCE(prs.points, 0) as stats_points,
      COALESCE(prs.rebounds, 0) as stats_rebounds,
      COALESCE(prs.assists, 0) as stats_assists,
      prs.minutes,
      COALESCE(ps.status, p.status) as current_status,
      p.id as player_exists
    FROM lineups l
    LEFT JOIN players p ON l.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = l.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id AND prs.season_id = l.season_id
    WHERE l.season_id = $3 AND l.user_id = $1 AND l.round_id = $2
    ORDER BY
      CASE
        WHEN p.position = 'Base' THEN 1
        WHEN p.position = 'Alero' THEN 2
        WHEN p.position = 'Pivot' THEN 3
        ELSE 4
      END
  `;

  const rawLineup = (await pgClient.query(query, [userId, roundId, seasonId])).rows as LineupRow[];

  // 2. Get User Round totals
  const totalsQuery = `
    SELECT
      ur.points,
      ur.participated,
      (
        SELECT COUNT(*) + 1
        FROM user_rounds ur2
        WHERE ur2.season_id = ur.season_id AND ur2.round_id = $2 AND ur2.points > ur.points
      ) as position
    FROM user_rounds ur
    WHERE ur.season_id = $3 AND ur.user_id = $1 AND ur.round_id = $2
  `;
  const totals = (await pgClient.query(totalsQuery, [userId, roundId, seasonId])).rows[0] as
    | LineupTotalsRow
    | undefined;

  // 3. Process lineup and detect missing players (ghost players)
  const lineup: LineupPlayer[] = rawLineup.map((p) => ({
    ...p,
    points: parseInt(String(p.raw_points)) || 0,
    stats_points: parseInt(String(p.stats_points)) || 0,
    valuation: parseInt(String(p.valuation)) || 0,
    is_missing: p.player_exists === null, // Flag missing players
    calculated: false,
  }));

  // 4. Calculate missing player fantasy points dynamically
  // Only works if exactly 1 player is missing stats
  const missingPlayers = lineup.filter((p) => p.is_missing && p.raw_points === null);
  const knownPlayers = lineup.filter((p) => !p.is_missing || p.raw_points !== null);

  if (missingPlayers.length === 1 && totals?.points) {
    const missing = missingPlayers[0];
    const totalPoints = parseInt(String(totals.points)) || 0;
    const knownSum = calculateWeightedSum(knownPlayers);

    // Calculate the weighted contribution of the missing player
    let missingWeightedContribution = totalPoints - knownSum;

    // Derive base fantasy points by dividing by the player's multiplier
    const mult = missing.is_captain
      ? 2.0
      : missing.role === 'titular'
        ? 1.0
        : missing.role === '6th_man'
          ? 0.75
          : 0.5;

    const calculatedPoints = Math.round(missingWeightedContribution / mult);

    // Update the missing player's points
    missing.points = calculatedPoints;
    missing.calculated = true; // Flag that this was calculated, not from DB
  } else if (missingPlayers.length > 1) {
    console.warn(
      `[getUserLineup] Multiple missing players for user ${userId} round ${roundId}. Cannot calculate individual points.`
    );
  }

  return {
    players: lineup,
    summary: totals
      ? {
          total_points: parseInt(String(totals.points)) || 0,
          round_rank: parseInt(String(totals.position)) || 0,
          participated: totals.participated,
        }
      : null,
  };
}

/**
 * Check if a round has official stats in user_rounds
 */
export async function hasOfficialStats(roundId: string | number): Promise<boolean> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT EXISTS(
      SELECT 1 FROM user_rounds
      WHERE season_id = $2 AND round_id = $1 AND participated = TRUE
    ) as exists
  `;
  const res = await pgClient.query(query, [roundId, seasonId]);
  return res.rows[0]?.exists || false;
}

/**
 * Get OFFICIAL standings from user_rounds (Final/Official results)
 * Returns both round points and cumulative (total) points up to the selected round.
 */
export async function getOfficialStandings(roundId: string | number): Promise<RoundStanding[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      u.id,
      COALESCE(us.name, u.name) as name,
      COALESCE(us.icon, u.icon) as icon,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      COALESCE(ur.points, 0) as round_points,
      COALESCE(
        (SELECT SUM(ur2.points)
         FROM user_rounds ur2
         WHERE ur2.season_id = $2
           AND ur2.user_id = u.id
           AND ur2.round_id <= $1
           AND ur2.participated = true),
        0
      ) as total_points,
      ur.participated
    FROM users u
    JOIN user_seasons us ON us.user_id = u.id AND us.season_id = $2
    LEFT JOIN user_rounds ur ON u.id = ur.user_id AND ur.season_id = $2 AND ur.round_id = $1
    WHERE COALESCE(us.status, 'active') <> 'inactive'
    ORDER BY round_points DESC, COALESCE(us.name, u.name) ASC
  `;
  return ((await pgClient.query(query, [roundId, seasonId])).rows as StandingRow[]).map((row) => ({
    ...row,
    points: parseInt(String(row.round_points)) || 0,
    round_points: parseInt(String(row.round_points)) || 0,
    total_points: parseInt(String(row.total_points)) || 0,
    participated: !!row.participated,
  }));
}

/**
 * Get LIVE/VIRTUAL standings calculated from lineups + player stats
 * Used when official stats are not yet available.
 * Returns both calculated round points and cumulative total_points from past rounds.
 */
export async function getLivingStandings(roundId: string | number): Promise<RoundStanding[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      u.id,
      COALESCE(us.name, u.name) as name,
      COALESCE(us.icon, u.icon) as icon,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      COALESCE(
        SUM(
          COALESCE(prs.fantasy_points, 0) *
          CASE
            WHEN l.is_captain::int = 1 THEN 2.0
            WHEN l.role = 'titular' THEN 1.0
            WHEN l.role = '6th_man' THEN 0.75
            ELSE 0.5
          END
        ),
      0) as round_points,
      COALESCE(
        (SELECT SUM(ur2.points)
         FROM user_rounds ur2
         WHERE ur2.season_id = $2
           AND ur2.user_id = u.id
           AND ur2.round_id < $1
           AND ur2.participated = true),
        0
      ) as past_total,
      MAX(CASE WHEN l.player_id IS NOT NULL THEN 1 ELSE 0 END) as participated
    FROM users u
    JOIN user_seasons us ON us.user_id = u.id AND us.season_id = $2
    LEFT JOIN lineups l ON u.id = l.user_id AND l.season_id = $2 AND l.round_id = $1
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND prs.season_id = $2 AND prs.round_id = $1
    WHERE COALESCE(us.status, 'active') <> 'inactive'
    GROUP BY u.id, us.name, us.icon, us.color_index
    ORDER BY round_points DESC, COALESCE(us.name, u.name) ASC
  `;

  return ((await pgClient.query(query, [roundId, seasonId])).rows as StandingRow[]).map((row) => {
    const round_points = Math.round(parseFloat(String(row.round_points)) || 0);
    const past_total = parseInt(String(row.past_total)) || 0;
    return {
      ...row,
      points: round_points,
      round_points: round_points,
      total_points: past_total + round_points,
      participated: !!row.participated,
    };
  });
}

/**
 * Get detailed statistics for a specific round
 */
export async function getRoundGlobalStats(roundId: string | number): Promise<RoundGlobalStats> {
  const seasonId = await resolveReadSeasonId();
  // 1. Round MVP (Fantasy Points Leader)
  const mvpQuery = `
    SELECT
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.fantasy_points as points, prs.valuation
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = prs.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    WHERE prs.season_id = $2 AND prs.round_id = $1
    ORDER BY prs.fantasy_points DESC NULLS LAST
    LIMIT 1
  `;

  // 2. Top Scorer (Real Points Leader)
  const topScorerQuery = `
    SELECT
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.points as stat_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = prs.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    WHERE prs.season_id = $2 AND prs.round_id = $1
    ORDER BY prs.points DESC NULLS LAST
    LIMIT 1
  `;

  // 3. Top Rebounder
  const topRebounderQuery = `
    SELECT
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.rebounds as stat_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = prs.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    WHERE prs.season_id = $2 AND prs.round_id = $1
    ORDER BY prs.rebounds DESC NULLS LAST
    LIMIT 1
  `;

  // 4. Top Assister
  const topAssisterQuery = `
    SELECT
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.assists as stat_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = prs.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    WHERE prs.season_id = $2 AND prs.round_id = $1
    ORDER BY prs.assists DESC NULLS LAST
    LIMIT 1
  `;

  // 5. Average Score
  const avgQuery = `
    SELECT ROUND(AVG(points), 1) as avg_score
    FROM user_rounds
    WHERE season_id = $2 AND round_id = $1 AND participated = TRUE
  `;

  // 6. Highest Score (Round Winner)
  const winnerQuery = `
    SELECT COALESCE(us.name, u.name) as name, ur.points, COALESCE(us.icon, u.icon) as icon
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ur.season_id
    WHERE ur.season_id = $2 AND ur.round_id = $1 AND ur.participated = TRUE
    ORDER BY ur.points DESC
    LIMIT 1
  `;

  const [mvpRes, topScorerRes, topRebounderRes, topAssisterRes, avgRes, winnerRes] =
    await Promise.all([
      pgClient.query(mvpQuery, [roundId, seasonId]),
      pgClient.query(topScorerQuery, [roundId, seasonId]),
      pgClient.query(topRebounderQuery, [roundId, seasonId]),
      pgClient.query(topAssisterQuery, [roundId, seasonId]),
      pgClient.query(avgQuery, [roundId, seasonId]),
      pgClient.query(winnerQuery, [roundId, seasonId]),
    ]);

  return {
    mvp: (mvpRes.rows[0] as MvpRow | undefined) || null,
    topScorer: (topScorerRes.rows[0] as StatLeaderRow | undefined) || null,
    topRebounder: (topRebounderRes.rows[0] as StatLeaderRow | undefined) || null,
    topAssister: (topAssisterRes.rows[0] as StatLeaderRow | undefined) || null,
    avgScore: parseFloat(avgRes.rows[0]?.avg_score) || 0,
    winner: (winnerRes.rows[0] as WinnerRow | undefined) || null,
  };
}

/**
 * Get the Ideal Lineup (Best 5 players) for a round
 */
export async function getIdealLineup(roundId: string | number): Promise<IdealLineupResult> {
  const seasonId = await resolveReadSeasonId();
  // Fetch top 50 to ensure we have enough for valid formations
  const query = `
    SELECT
      p.id as player_id, p.name, p.position, p.img, COALESCE(ps.team_id, p.team_id) as team_id,
      t.short_name as team_short, t.img as team_img,
      prs.fantasy_points as points, prs.valuation
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = prs.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    WHERE prs.season_id = $2 AND prs.round_id = $1
    ORDER BY prs.fantasy_points DESC
    LIMIT 50
  `;

  const allStats = (await pgClient.query(query, [roundId, seasonId])).rows as IdealPlayerRow[];

  const { idealLineup, totalPoints } = selectIdealLineup(allStats);

  return {
    idealLineup,
    totalPoints,
  };
}

/**
 * HELPER: Reconstruct the user's squad at the start of a specific round.
 * Uses current ownership + transfer history replay.
 */
async function getHistoricSquad(userId: string, roundId: string | number): Promise<Set<number>> {
  try {
    const seasonId = await resolveReadSeasonId();
    // 1. Get User Name (fichajes table stores names, not IDs)
    const userRes = await pgClient.query(
      `
      SELECT COALESCE(us.name, u.name) as name
      FROM users u
      JOIN user_seasons us ON us.user_id = u.id AND us.season_id = $2
      WHERE u.id = $1
    `,
      [userId, seasonId]
    );
    if (userRes.rows.length === 0) return new Set();
    const userName = userRes.rows[0].name;

    // 2. Get Round Start Date (Lock Time)
    const roundRes = await pgClient.query(
      'SELECT MIN(date) as start_date FROM matches WHERE season_id = $2 AND round_id = $1',
      [roundId, seasonId]
    );
    if (!roundRes.rows[0]?.start_date) return new Set();

    // Ensure we compare timestamps correctly (Postgres Date -> JS Timestamp)
    // fichajes.timestamp is in SECONDS (BigInt), matches.date is Date object.
    const roundTs = Math.floor(new Date(roundRes.rows[0].start_date).getTime() / 1000);

    // [TIMEZONE FIX] User reports DB dates are 1 hour early (e.g. 15:00 UTC vs actual 17:00 Madrid/16:00 UTC).
    // Adding 1 hour (3600 seconds) buffer to align with reality.
    // This ensures transfers that happened "before" the real match (but after the wrong DB time) are kept.
    const adjustedRoundTs = roundTs + 3600;

    // 3. Get Current Squad
    const squadRes = await pgClient.query(
      'SELECT player_id FROM player_seasons WHERE season_id = $2 AND owner_id = $1',
      [userId, seasonId]
    );
    const squad = new Set<number>(squadRes.rows.map((r: { player_id: number }) => r.player_id));

    // 4. Fetch Transfers that happened AFTER the round start
    // We need to reverse these actions to get back to the state at round_start.
    const transfersRes = await pgClient.query(
      `
      SELECT player_id, vendedor, comprador, timestamp
      FROM fichajes
      WHERE season_id = $3
        AND (vendedor = $1 OR comprador = $1)
        AND timestamp >= $2
      ORDER BY timestamp DESC
      `,
      [userName, adjustedRoundTs, seasonId]
    );

    // 5. Replay history BACKWARDS
    for (const transfer of transfersRes.rows) {
      const { player_id, vendedor, comprador } = transfer;

      // If use BOUGHT player X after round, then at round start they DID NOT have X.
      if (comprador === userName) {
        squad.delete(player_id);
      }
      // If user SOLD player X after round, then at round start they DID have X.
      else if (vendedor === userName) {
        squad.add(player_id);
      }
    }

    return squad;
  } catch (err) {
    console.error('Error calculating historic squad:', err);
    return new Set<number>();
  }
}

/**
 * Get the players left out of the lineup who performed well
 */
export async function getPlayersLeftOut(
  userId: string,
  roundId: string | number
): Promise<SquadPlayerRow[]> {
  const seasonId = await resolveReadSeasonId();
  // 1. Get Historic Squad at round start
  const historicSquad = await getHistoricSquad(userId, roundId);
  if (historicSquad.size === 0) return [];

  // 2. Get User's Actual Lineup
  const lineupQuery = `
    SELECT player_id FROM lineups WHERE season_id = $3 AND user_id = $1 AND round_id = $2
  `;
  const lineupRes = await pgClient.query(lineupQuery, [userId, roundId, seasonId]);
  const lineupIds = new Set(lineupRes.rows.map((r: { player_id: number }) => r.player_id));

  // 3. Find players in Squad but NOT in Lineup
  const leftOutIds = Array.from(historicSquad).filter((id) => !lineupIds.has(id));

  if (leftOutIds.length === 0) return [];

  // 4. Get stats for left out players
  const statsQuery = `
    SELECT
      prs.player_id,
      p.name,
      p.position,
      p.img,
      t.short_name as team_short,
      t.img as team_img,
      prs.fantasy_points as points
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = prs.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    WHERE prs.season_id = $3 AND prs.round_id = $1 AND prs.player_id = ANY($2)
    ORDER BY prs.fantasy_points DESC
  `;

  return (await pgClient.query(statsQuery, [roundId, leftOutIds, seasonId])).rows;
}

/**
 * Get the optimal lineup a user COULD have fielded
 */
export async function getUserOptimization(
  userId: string,
  roundId: string | number
): Promise<OptimizationResult | null> {
  const seasonId = await resolveReadSeasonId();
  // 1. Get Historic Squad
  const historicSquad = await getHistoricSquad(userId, roundId);
  if (historicSquad.size === 0) return null;

  // 2. Get Stats for ALL squad players
  const statsQuery = `
    SELECT
      p.id as player_id,
      p.name,
      p.position,
      p.img,
      t.short_name as team_short,
      t.img as team_img,
      COALESCE(prs.fantasy_points, 0) as points,
      COALESCE(prs.valuation, 0) as valuation
    FROM players p
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $3
    LEFT JOIN player_round_stats prs ON prs.player_id = p.id AND prs.season_id = $3 AND prs.round_id = $1
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    WHERE p.id = ANY($2)
    ORDER BY COALESCE(prs.fantasy_points, 0) DESC
  `;

  const squadStats = (
    await pgClient.query(statsQuery, [roundId, Array.from(historicSquad), seasonId])
  ).rows as OptimizationPlayerRow[];

  // 3. Inject ghost players (players in lineups but deleted from the players table).
  //    getHistoricSquad cannot find them because it queries players.owner_id, and ghost
  //    players have been removed from the players table entirely.
  //    getUserLineup already back-calculates their points (total - known players weighted sum).
  //    We inject them here so the greedy algorithm can include them in the optimal lineup,
  //    which prevents actualScore > maxScore (efficiency > 100%).
  const lineupPlayers = await getUserLineup(userId, roundId);
  if (lineupPlayers) {
    const knownIds = new Set(squadStats.map((s) => s.player_id));
    for (const player of lineupPlayers.players) {
      if (!knownIds.has(player.player_id)) {
        squadStats.push({
          player_id: player.player_id,
          name: player.name || 'Unknown Player',
          position:
            player.position && player.position !== 'Bench'
              ? player.position
              : inferGhostPosition(lineupPlayers.players, player, squadStats),
          img: player.img ?? null,
          team_short: player.team_short ?? null,
          team_img: player.team_img ?? null,
          points: player.points,
          valuation: player.valuation || 0,
        });
        knownIds.add(player.player_id);
      }
    }
    // Re-sort by points descending so the greedy algorithm picks the best players first.
    squadStats.sort((a, b) => (b.points || 0) - (a.points || 0));
  }

  return selectOptimalSquad(squadStats);
}

/**
 * Get full user history for all rounds (DAO)
 */
export async function getUserRoundsHistoryDAO(userId: string): Promise<RoundHistoryRow[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      ur.round_id,
      ur.points as actual_points,
      ur.participated,
      m.round_name
    FROM user_rounds ur
    JOIN (
      SELECT round_id, MAX(round_name) as round_name
      FROM matches
      WHERE season_id = $2
      GROUP BY round_id
    ) m ON ur.round_id = m.round_id
    WHERE ur.season_id = $2 AND ur.user_id = $1
    ORDER BY ur.round_id ASC
  `;
  return (await pgClient.query(query, [userId, seasonId])).rows;
}

/**
 * Get usage stats for different lineup formations
 */
export async function getLineupUsageStats(): Promise<LineupUsageResult> {
  const seasonId = await resolveReadSeasonId();
  const globalQuery = `
    WITH PerRoundFormation AS (
      SELECT
        l.round_id,
        l.user_id,
        SUM(CASE WHEN p.position = 'Base' THEN 1 ELSE 0 END)::int as base_count,
        SUM(CASE WHEN p.position = 'Alero' THEN 1 ELSE 0 END)::int as alero_count,
        SUM(CASE WHEN p.position = 'Pivot' THEN 1 ELSE 0 END)::int as pivot_count,
        COUNT(*)::int as starters_count,
        SUM(CASE WHEN p.position IN ('Base', 'Alero', 'Pivot') THEN 1 ELSE 0 END)::int as known_pos_count
      FROM lineups l
      LEFT JOIN players p ON l.player_id = p.id
      WHERE l.season_id = $1 AND l.role = 'titular'
      GROUP BY l.round_id, l.user_id
      HAVING COUNT(*) = 5
         AND SUM(CASE WHEN p.position IN ('Base', 'Alero', 'Pivot') THEN 1 ELSE 0 END) = 5
    )
    SELECT
      l.user_id,
      CONCAT(
        l.base_count, '-',
        l.alero_count, '-',
        l.pivot_count
      ) as alineacion,
      COUNT(*) as count
    FROM PerRoundFormation l
    GROUP BY l.round_id, l.user_id, l.base_count, l.alero_count, l.pivot_count
  `;

  // Wrap in outer query to group by formation
  const finalGlobalQuery = `
    WITH Formations AS (
      ${globalQuery}
    )
    SELECT alineacion, COUNT(*)::int as count
    FROM Formations
    GROUP BY alineacion
    ORDER BY count DESC
  `;

  const userQuery = `
    WITH Formations AS (
      ${globalQuery}
    ),
    UserFormationCounts AS (
      SELECT user_id, alineacion, COUNT(*)::int as count
      FROM Formations
      GROUP BY user_id, alineacion
    ),
    Ranked AS (
      SELECT
        user_id,
        alineacion,
        count,
        SUM(count) OVER (PARTITION BY user_id)::int as total_count,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY count DESC, alineacion ASC) as formation_rank
      FROM UserFormationCounts
    )
    SELECT user_id, alineacion, count, total_count, formation_rank
    FROM Ranked
    WHERE formation_rank <= 2
    ORDER BY user_id, formation_rank
  `;

  const [globalRes, userRes] = await Promise.all([
    pgClient.query(finalGlobalQuery, [seasonId]),
    pgClient.query(userQuery, [seasonId]),
  ]);

  return {
    global: globalRes.rows,
    byUser: userRes.rows,
  };
}

/**
 * Calculate the Coach Rating for a user in a specific round.
 * This determines the "Max Possible Score" a user could have achieved
 * with their squad (Ideal Lineup from owned players).
 */
export async function getCoachRating(
  userId: string,
  roundId: string | number
): Promise<CoachRating | null> {
  const optimization = await getUserOptimization(userId, roundId);
  const userLineup = await getUserLineup(userId, roundId);

  // If we can't get optimization data, we cannot compute coach rating.
  if (!optimization || !userLineup) {
    return null;
  }

  const maxScore = Math.round(optimization.totalPoints);
  // In live rounds user_rounds rows may not exist yet, so summary can be null.
  // Fall back to calculating the live score directly from lineup player stats.
  const actualScore = Math.round(
    userLineup.summary ? userLineup.summary.total_points : calculateWeightedSum(userLineup.players)
  );

  // calcEfficiency is the single source of truth; values over 100 remain visible.
  const efficiency = calcEfficiency(actualScore, maxScore);

  return {
    actualScore,
    maxScore,
    efficiency,
    idealLineup: optimization.optimalLineup,
  };
}
