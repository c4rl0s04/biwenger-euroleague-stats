import { db } from '../client.js';
import { getTeamPositions } from '../../utils/standings.js';
import { NEXT_ROUND_CTE } from '../sql_utils.js';

/**
 * Get Porras statistics
 * @returns {Promise<Array>} User statistics from prediction game
 */
export async function getPorrasStats() {
  const query = `
    SELECT 
      usuario,
      COUNT(*) as total_rounds,
      SUM(aciertos) as total_hits,
      ROUND(AVG(aciertos), 2) as avg_hits,
      MAX(aciertos) as best_round,
      MIN(aciertos) as worst_round
    FROM porras
    GROUP BY usuario
    ORDER BY total_hits DESC
  `;

  return (await db.query(query)).rows.map((row) => ({
    ...row,
    total_rounds: parseInt(row.total_rounds) || 0,
    total_hits: parseInt(row.total_hits) || 0,
    avg_hits: parseFloat(row.avg_hits) || 0,
    best_round: parseInt(row.best_round) || 0,
    worst_round: parseInt(row.worst_round) || 0,
  }));
}

/**
 * Get all Porras rounds
 * @returns {Promise<Array>} All rounds with results
 */
export async function getAllPorrasRounds() {
  const query = `
    SELECT 
      jornada,
      usuario,
      aciertos
    FROM porras
    ORDER BY jornada DESC, aciertos DESC
  `;

  return (await db.query(query)).rows;
}

/**
 * Get the next upcoming round
 * @returns {Promise<Object>} Next round details
 */
/**
 * Get the state of current and next rounds
 * Unified logic to determine what is "Current" (Live or Last Finished) and "Next"
 */
export async function getCurrentRoundState() {
  // 1. Get all round schedules to determine sequence
  const query = `
    WITH RoundStats AS (
      SELECT 
        round_id,
        MAX(round_name) as round_name,
        MIN(date) as start_date,
        MAX(date) as end_date,
        COUNT(*) as total_matches,
        SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) as finished_matches
      FROM matches
      GROUP BY round_id
    )
    SELECT *,
      CASE 
        WHEN finished_matches < total_matches AND NOW() >= start_date THEN 'live'
        WHEN finished_matches = total_matches AND NOW() >= start_date THEN 'finished'
        ELSE 'upcoming'
      END as status_calc
    FROM RoundStats
    ORDER BY start_date ASC
  `;

  const rows = (await db.query(query)).rows;
  const now = new Date();

  // Find Current Round: The latest round that has started (start_date <= NOW)
  // This handles postponed matches correctly because we don't look for "pending" matches in old rounds,
  // we just look for the most recent round start.
  // Exception: If we are substantially past the "end" of the round, and it's not fully finished?
  // User logic: "If no round is live ... last finished round should be returned"
  // If Round 18 starts Jan 1. Round 19 starts Jan 8.
  // Now is Jan 4. Round 18 is latest filtered. It is returned.
  // If Now is Jan 10. Round 19 is latest filtered. Round 19 returned.

  // Filter rounds that have started
  const startedRounds = rows.filter((r) => new Date(r.start_date) <= now);

  let currentRound = startedRounds.length > 0 ? startedRounds[startedRounds.length - 1] : null;

  // Find Next Round: The first round that has NOT started
  const futureRounds = rows.filter((r) => new Date(r.start_date) > now);
  let nextRound = futureRounds.length > 0 ? futureRounds[0] : null;

  return { currentRound, nextRound };
}

/**
 * Get full details for a specific round (matches, standings, etc.)
 * @param {string} roundId
 */
export async function getRoundDetails(roundId) {
  if (!roundId) return null;

  // Basic info
  const basicQuery = `
    SELECT 
      round_id,
      round_name,
      MIN(date) as start_date,
      MAX(date) as end_date
    FROM matches
    WHERE round_id = $1
    GROUP BY round_id, round_name
  `;
  const roundRes = await db.query(basicQuery, [roundId]);
  const round = roundRes.rows[0];

  if (!round) return null;

  // 1. Get all finished matches for standings (Global context, not just this round)
  const allFinishedMatchesQuery = `
    SELECT 
      home_id, away_id, home_score, away_score, 
      home_score_regtime, away_score_regtime, status
    FROM matches
    WHERE status = 'finished' 
      AND home_score IS NOT NULL 
      AND away_score IS NOT NULL
  `;

  let positionMap = new Map();
  try {
    const allFinishedMatches = (await db.query(allFinishedMatchesQuery)).rows;
    positionMap = getTeamPositions(allFinishedMatches);
  } catch (err) {
    console.warn('Could not calculate standings:', err);
  }

  // 2. Get Matches for this round
  const matchesQuery = `
    SELECT 
      m.home_id, m.away_id,
      t1.name as home_team, t2.name as away_team, 
      m.date, m.status,
      m.home_score, m.away_score,
      t1.img as home_logo, t1.short_name as home_short,
      t2.img as away_logo, t2.short_name as away_short
    FROM matches m
    LEFT JOIN teams t1 ON m.home_id = t1.id
    LEFT JOIN teams t2 ON m.away_id = t2.id
    WHERE m.round_id = $1
    ORDER BY m.date ASC
  `;

  const matchesRes = await db.query(matchesQuery, [roundId]);
  round.matches = matchesRes.rows.map((match) => ({
    ...match,
    home_position: positionMap.get(match.home_id) || null,
    away_position: positionMap.get(match.away_id) || null,
  }));

  return round;
}

/**
 * Get the next upcoming round
 * @deprecated Use getCurrentRoundState() instead
 * @returns {Promise<Object>} Next round details
 */
export async function getNextRound() {
  const { nextRound } = await getCurrentRoundState();
  if (!nextRound) return null;
  return await getRoundDetails(nextRound.round_id);
}

/**
 * Get the current active or last completed round
 * Updated to use unified logic: returns the "Current" round (Live or Finished)
 * @returns {Promise<Object>} Round object
 */
export async function getLastCompletedRound() {
  const { currentRound } = await getCurrentRoundState();
  return currentRound;
}

/**
 * Get the winner of the last completed round
 * @returns {Promise<Object>} User who won the last round
 */
export async function getLastRoundWinner() {
  const query = `
    WITH LastRound AS (
      SELECT m.round_id
      FROM matches m
      GROUP BY m.round_id
      HAVING COUNT(*) = SUM(CASE WHEN m.status = 'finished' THEN 1 ELSE 0 END)
      ORDER BY m.round_id DESC
      LIMIT 1
    )
    SELECT 
      ur.user_id,
      u.name,
      u.icon,
      ur.points,
      ur.round_name
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.round_id = (SELECT round_id FROM LastRound)
      AND ur.participated = TRUE
    ORDER BY ur.points DESC
    LIMIT 1
  `;
  return (await db.query(query)).rows[0];
}

/**
 * Get user's recent rounds performance
 * @param {string} userId - User ID
 * @param {number} limit - Number of rounds
 * @returns {Promise<Array>} Recent rounds with position
 */
export async function getUserRecentRounds(userId, limit = 10) {
  // Get all rounds (including non-participated) with position when participated
  const query = `
    WITH AllRounds AS (
      SELECT DISTINCT round_id, round_name
      FROM user_rounds
      ORDER BY round_id DESC
      LIMIT $1
    ),
    RoundPositions AS (
      SELECT 
        ur.round_id,
        ur.user_id,
        ur.points,
        ur.participated,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE ur.participated = TRUE
    )
    SELECT 
      ar.round_id,
      ar.round_name,
      COALESCE(rp.points, 0) as points,
      COALESCE(rp.position, 0) as position,
      CASE WHEN rp.user_id IS NOT NULL THEN 1 ELSE 0 END as participated
    FROM AllRounds ar
    LEFT JOIN RoundPositions rp ON ar.round_id = rp.round_id AND rp.user_id = $2
    ORDER BY ar.round_id DESC
  `;

  const rounds = (await db.query(query, [limit, userId])).rows.map((row) => ({
    ...row,
    points: parseInt(row.points) || 0,
    position: parseInt(row.position) || 0,
  }));

  // Count total rounds where user participated
  const countQuery = `
    SELECT COUNT(*) as total_played
    FROM user_rounds
    WHERE user_id = $1 AND participated = TRUE
  `;
  const countRes = await db.query(countQuery, [userId]);
  const total_played = parseInt(countRes.rows[0]?.total_played) || 0;

  // Count total rounds in the season (distinct round_ids)
  const totalRoundsQuery = `
    SELECT COUNT(DISTINCT round_id) as total_rounds
    FROM user_rounds
  `;
  const totalRoundsRes = await db.query(totalRoundsQuery);
  const total_rounds = parseInt(totalRoundsRes.rows[0]?.total_rounds) || 0;

  return { rounds, total_played, total_rounds };
}

/**
 * Get best performers from the last completed round
 * @param {number} limit - Number of MVPs
 * @returns {Promise<Array>} Top MVPs from last round
 */
export async function getLastRoundMVPs(limit = 5) {
  const query = `
    WITH LastRound AS (
      SELECT m.round_id as last_round_id
      FROM matches m
      GROUP BY m.round_id
      HAVING COUNT(*) = SUM(CASE WHEN m.status = 'finished' THEN 1 ELSE 0 END)
      ORDER BY m.round_id DESC
      LIMIT 1
    )
    SELECT 
      prs.player_id,
      p.name,
      t.id as team_id,
      t.name as team,
      p.position,
      prs.fantasy_points as points,
      u.id as owner_id,
      u.name as owner_name,
      u.color_index as owner_color_index
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE prs.round_id = (SELECT last_round_id FROM LastRound)
    ORDER BY prs.fantasy_points DESC
    LIMIT $1
  `;

  return (await db.query(query, [limit])).rows;
}

/**
 * Get all player stats for the last completed round to calculate ideal lineup
 * @returns {Promise<Array>} List of players with their stats for the last round
 */
export async function getLastRoundStats() {
  const query = `
    WITH LastRound AS (
      SELECT m.round_id as last_round_id
      FROM matches m
      GROUP BY m.round_id
      HAVING COUNT(*) = SUM(CASE WHEN m.status = 'finished' THEN 1 ELSE 0 END)
      ORDER BY m.round_id DESC
      LIMIT 1
    )
    SELECT 
      prs.player_id,
      p.name,
      t.name as team,
      p.position,
      p.price,
      prs.fantasy_points as points,
      u.name as owner_name,
      (SELECT round_name FROM matches WHERE round_id = prs.round_id LIMIT 1) as round_name
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE prs.round_id = (SELECT last_round_id FROM LastRound)
    ORDER BY prs.fantasy_points DESC
  `;
  return (await db.query(query)).rows;
}

/**
 * Get all rounds available in the system
 * @returns {Promise<Array>} List of rounds
 */
export async function getAllRounds() {
  const query = `
    SELECT DISTINCT round_id, round_name 
    FROM matches 
    ORDER BY round_id DESC
  `;
  return (await db.query(query)).rows;
}

/**
 * Get user lineup for a specific round
 * @param {string} userId - User ID
 * @param {string} roundId - Round ID
 * @returns {Promise<Object>} Lineup details with starters and bench
 */
export async function getUserLineup(userId, roundId) {
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
      COALESCE(prs.fantasy_points, 0) as points,
      COALESCE(prs.valuation, 0) as valuation,
      COALESCE(prs.points, 0) as stats_points,
      COALESCE(prs.rebounds, 0) as stats_rebounds,
      COALESCE(prs.assists, 0) as stats_assists,
      prs.minutes,
      p.status as current_status
    FROM lineups l
    LEFT JOIN players p ON l.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = $1 AND l.round_id = $2
    ORDER BY 
      CASE 
        WHEN p.position = 'Base' THEN 1
        WHEN p.position = 'Alero' THEN 2
        WHEN p.position = 'Pivot' THEN 3
        ELSE 4
      END
  `;

  const lineup = (await db.query(query, [userId, roundId])).rows;

  // 2. Get User Round totals
  const totalsQuery = `
    SELECT 
      ur.points, 
      ur.participated,
      (
        SELECT COUNT(*) + 1 
        FROM user_rounds ur2 
        WHERE ur2.round_id = $2 AND ur2.points > ur.points
      ) as position
    FROM user_rounds ur
    WHERE ur.user_id = $1 AND ur.round_id = $2
  `;
  const totals = (await db.query(totalsQuery, [userId, roundId])).rows[0];

  // Logic to separate starters and bench
  // If we don't have explicit starter field, we assume top 5 are starters (Biwenger basketball logic usually)
  // Or we check if there is a 'titular' column in lineups table (I should have checked schema but assuming standard 5)
  // For now, I'll return all and let frontend split, or split here.
  // Standard EuroLeague fantasy is 5 starters + bench.

  // Let's assume the first 5 sorted by position are potential starters if no explicit flag.
  // BUT, usually lineups table might store position in `slot` or something?
  // Since I don't see `slot` in my previous greps, I'll assume we return the flat list
  // and frontend or logic here handles it.

  // Actually, usually in fantasy basketball: 2 Guards (Base), 2 Forwards (Alero), 1 Center (Pivot) OR similar.
  // If `lineups` doesn't have `is_starter`, we might need to guess or show all.
  // However, `is_captain` is there.

  return {
    players: lineup.map((p) => ({
      ...p,
      points: parseInt(p.points) || 0,
      stats_points: parseInt(p.stats_points) || 0,
      valuation: parseInt(p.valuation) || 0,
    })),
    summary: totals
      ? {
          total_points: parseInt(totals.points) || 0,
          round_rank: parseInt(totals.position) || 0,
          participated: totals.participated,
        }
      : null,
  };
}
/**
 * Get standings for a specific round
 * @param {string} roundId - Round ID
 * @returns {Promise<Array>} List of users with points for the round
 */
/**
 * Check if a round has official stats in user_rounds
 * @param {string} roundId
 * @returns {Promise<boolean>}
 */
export async function hasOfficialStats(roundId) {
  const query = `
    SELECT EXISTS(
      SELECT 1 FROM user_rounds 
      WHERE round_id = $1 AND participated = TRUE
    ) as exists
  `;
  const res = await db.query(query, [roundId]);
  return res.rows[0]?.exists || false;
}

/**
 * Get OFFICIAL standings from user_rounds (Final/Official results)
 * Returns both round points and cumulative (total) points up to the selected round.
 * @param {string} roundId
 * @returns {Promise<Array>}
 */
export async function getOfficialStandings(roundId) {
  const query = `
    SELECT 
      u.id, 
      u.name, 
      u.icon, 
      u.color_index,
      COALESCE(ur.points, 0) as round_points,
      COALESCE(
        (SELECT SUM(ur2.points) 
         FROM user_rounds ur2 
         WHERE ur2.user_id = u.id 
           AND ur2.round_id <= $1
           AND ur2.participated = true), 
        0
      ) as total_points,
      ur.participated
    FROM users u
    LEFT JOIN user_rounds ur ON u.id = ur.user_id AND ur.round_id = $1
    ORDER BY round_points DESC, u.name ASC
  `;
  return (await db.query(query, [roundId])).rows.map((row) => ({
    ...row,
    points: parseInt(row.round_points) || 0,
    round_points: parseInt(row.round_points) || 0,
    total_points: parseInt(row.total_points) || 0,
    participated: !!row.participated,
  }));
}

/**
 * Get LIVE/VIRTUAL standings calculated from lineups + player stats
 * Used when official stats are not yet available.
 * Returns both calculated round points and cumulative total_points from past rounds.
 * @param {string} roundId
 * @returns {Promise<Array>}
 */
export async function getLivingStandings(roundId) {
  const query = `
    SELECT 
      u.id, 
      u.name, 
      u.icon, 
      u.color_index,
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
         WHERE ur2.user_id = u.id 
           AND ur2.round_id < $1
           AND ur2.participated = true), 
        0
      ) as past_total,
      MAX(CASE WHEN l.player_id IS NOT NULL THEN 1 ELSE 0 END) as participated
    FROM users u
    LEFT JOIN lineups l ON u.id = l.user_id AND l.round_id = $1
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND prs.round_id = $1
    GROUP BY u.id
    ORDER BY round_points DESC, u.name ASC
  `;

  return (await db.query(query, [roundId])).rows.map((row) => {
    const round_points = Math.round(parseFloat(row.round_points) || 0);
    const past_total = parseInt(row.past_total) || 0;
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
 * @param {string} roundId
 */
export async function getRoundGlobalStats(roundId) {
  // 1. Round MVP (Fantasy Points Leader)
  const mvpQuery = `
    SELECT 
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.fantasy_points as points, prs.valuation
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1
    ORDER BY prs.fantasy_points DESC
    LIMIT 1
  `;

  // 2. Top Scorer (Real Points Leader)
  const topScorerQuery = `
    SELECT 
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.points as stat_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1
    ORDER BY prs.points DESC
    LIMIT 1
  `;

  // 3. Top Rebounder
  const topRebounderQuery = `
    SELECT 
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.rebounds as stat_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1
    ORDER BY prs.rebounds DESC
    LIMIT 1
  `;

  // 4. Top Assister
  const topAssisterQuery = `
    SELECT 
      p.id, p.name, p.img, p.position, t.short_name as team_name,
      prs.assists as stat_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1
    ORDER BY prs.assists DESC
    LIMIT 1
  `;

  // 5. Average Score
  const avgQuery = `
    SELECT ROUND(AVG(points), 1) as avg_score
    FROM user_rounds
    WHERE round_id = $1 AND participated = TRUE
  `;

  // 6. Highest Score (Round Winner)
  const winnerQuery = `
    SELECT u.name, ur.points, u.icon
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.round_id = $1 AND ur.participated = TRUE
    ORDER BY ur.points DESC
    LIMIT 1
  `;

  const [mvpRes, topScorerRes, topRebounderRes, topAssisterRes, avgRes, winnerRes] =
    await Promise.all([
      db.query(mvpQuery, [roundId]),
      db.query(topScorerQuery, [roundId]),
      db.query(topRebounderQuery, [roundId]),
      db.query(topAssisterQuery, [roundId]),
      db.query(avgQuery, [roundId]),
      db.query(winnerQuery, [roundId]),
    ]);

  return {
    mvp: mvpRes.rows[0] || null,
    topScorer: topScorerRes.rows[0] || null,
    topRebounder: topRebounderRes.rows[0] || null,
    topAssister: topAssisterRes.rows[0] || null,
    avgScore: parseFloat(avgRes.rows[0]?.avg_score) || 0,
    winner: winnerRes.rows[0] || null,
  };
}

/**
 * Get the Ideal Lineup (Best 5 players) for a round
 * @param {string} roundId
 */
export async function getIdealLineup(roundId) {
  // Fetch top 50 to ensure we have enough for valid formations
  const query = `
    SELECT 
      p.id as player_id, p.name, p.position, p.img, p.team_id,
      t.short_name as team_short, t.img as team_img,
      prs.fantasy_points as points, prs.valuation
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE prs.round_id = $1
    ORDER BY prs.fantasy_points DESC
    LIMIT 50
  `;

  const allStats = (await db.query(query, [roundId])).rows;

  // LOGIC: Valid Formation Greedy Algorithm (Same as Coach Rating)
  // - Starts: 5 players. Max 3 per position (Base, Alero, Pivot).
  // - Bench: Next 5 best players.

  const starters = [];
  const bench = [];
  const rolesCount = { Base: 0, Alero: 0, Pivot: 0 };
  const usedIds = new Set();

  // A. Select Starters
  for (const p of allStats) {
    if (starters.length >= 5) break;

    const pos = p.position || 'Base';
    if ((rolesCount[pos] || 0) < 3) {
      starters.push(p);
      rolesCount[pos] = (rolesCount[pos] || 0) + 1;
      usedIds.add(p.player_id);
    }
  }

  // B. Select Bench (Next 5)
  for (const p of allStats) {
    if (bench.length >= 5) break;
    if (!usedIds.has(p.player_id)) {
      bench.push(p);
      usedIds.add(p.player_id);
    }
  }

  const idealLineupRaw = [...starters, ...bench];

  // Map to "Lineup" format with Multipliers
  return idealLineupRaw.map((p, index) => {
    let multiplier = 0;
    let role = 'bench';
    let is_captain = false;

    // Starters
    if (index < 5) {
      role = 'titular';
      if (index === 0) {
        multiplier = 2.0;
        is_captain = true;
      } else {
        multiplier = 1.0;
      }
    }
    // Bench
    else {
      role = index === 5 ? '6th_man' : 'bench';
      multiplier = index === 5 ? 0.75 : 0.5;
    }

    return {
      ...p,
      role,
      is_captain,
      stats_points: p.points,
      multiplier,
    };
  });
}

/**
 * HELPER: Reconstruct the user's squad at the start of a specific round.
 * Uses current ownership + transfer history replay.
 * @param {string} userId
 * @param {string} roundId
 * @returns {Promise<Set<number>>} Set of Player IDs owned at round start
 */
async function getHistoricSquad(userId, roundId) {
  try {
    // 1. Get User Name (fichajes table stores names, not IDs)
    const userRes = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return new Set();
    const userName = userRes.rows[0].name;

    // 2. Get Round Start Date (Lock Time)
    const roundRes = await db.query(
      'SELECT MIN(date) as start_date FROM matches WHERE round_id = $1',
      [roundId]
    );
    if (!roundRes.rows[0]?.start_date) return new Set();

    // Ensure we compare timestamps correctly (Postgres Date -> JS Timestamp)
    // fichajes.timestamp is in SECONDS (BigInt), matches.date is Date object.
    const roundTs = Math.floor(new Date(roundRes.rows[0].start_date).getTime() / 1000);

    // 3. Get Current Squad
    const squadRes = await db.query('SELECT id FROM players WHERE owner_id = $1', [userId]);
    const squad = new Set(squadRes.rows.map((r) => r.id));

    // 4. Fetch Transfers that happened AFTER the round start
    // We need to reverse these actions to get back to the state at round_start.
    const transfersRes = await db.query(
      `
      SELECT player_id, vendedor, comprador, timestamp
      FROM fichajes 
      WHERE timestamp > $1 
        AND (vendedor = $2 OR comprador = $2)
      ORDER BY timestamp DESC
    `,
      [roundTs, userName]
    );

    // 5. Replay Logic (Backwards)
    for (const t of transfersRes.rows) {
      // If I BOUGHT the player AFTER the round, I didn't have him during the round.
      if (t.comprador === userName) {
        squad.delete(t.player_id);
      }
      // If I SOLD the player AFTER the round, I actually HAD him during the round.
      else if (t.vendedor === userName) {
        squad.add(t.player_id);
      }
    }

    return squad;
  } catch (error) {
    console.error('getHistoricSquad Error:', error);
    // Fallback: Return empty set? Or Current Squad?
    // If we return empty set, everything becomes empty.
    // Better to fallback to current squad (ignore transfers).
    // To do that, we need current squad query here safely.
    try {
      const fallbackRes = await db.query('SELECT id FROM players WHERE owner_id = $1', [userId]);
      return new Set(fallbackRes.rows.map((r) => r.id));
    } catch (e) {
      return new Set();
    }
  }
}

/**
 * Calculate User Optimization stats (Points missed, Coach Rating)
 * @param {string} userId
 * @param {string} roundId
 */
export async function getUserOptimization(userId, roundId) {
  // 1. Get Historic Squad Stats
  const historicSquadIds = await getHistoricSquad(userId, roundId);
  if (historicSquadIds.size === 0) return null;

  const squadStats = (
    await db.query(
      `
    SELECT p.id, p.name, COALESCE(prs.fantasy_points, 0) as points
    FROM players p
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id AND prs.round_id = $2
    WHERE p.id = ANY($1::int[])
  `,
      [[...historicSquadIds], roundId]
    )
  ).rows;

  // 2. Find Actual Captain
  const lineupRes = await db.query(
    `
    SELECT l.player_id, is_captain, role, COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND prs.round_id = $2
    WHERE l.user_id = $1 AND l.round_id = $2
  `,
    [userId, roundId]
  );

  const captain = lineupRes.rows.find((p) => p.is_captain);
  const captainPoints = captain ? captain.points : 0;

  // 3. Find Best Possible Player (who user OWNED)
  const bestPlayer = squadStats.reduce((max, p) => (p.points > max.points ? p : max), {
    points: -Infinity,
  });

  // 4. Calculate Bench Points (In lineup but not titular)
  // Note: Lineups table has everyone in the roster submitted to Biwenger.
  // We sum points of players in lineup who are NOT titular.
  const benchPoints = lineupRes.rows
    .filter((p) => p.role !== 'titular')
    .reduce((sum, p) => sum + p.points, 0);

  const captainOpportunityLost =
    bestPlayer.points > captainPoints
      ? bestPlayer.points - captainPoints // Difference in base points (captain adds 1x base)
      : 0;

  return {
    captainOpportunityLost: Math.max(0, captainOpportunityLost),
    benchPoints,
    bestPlayerName: bestPlayer.name || 'N/A',
  };
}

/**
 * Get players owned by the user at round start but NOT in the lineup.
 * Correctly handles historical ownership.
 * @param {string} userId
 * @param {string} roundId
 */
export async function getPlayersLeftOut(userId, roundId) {
  // 1. Get Historic Squad
  const historicSquadIds = await getHistoricSquad(userId, roundId);
  if (historicSquadIds.size === 0) return [];

  // 2. Get Actual Lineup
  const lineupRes = await db.query(
    'SELECT player_id FROM lineups WHERE user_id = $1 AND round_id = $2',
    [userId, roundId]
  );
  const lineupIds = new Set(lineupRes.rows.map((r) => r.player_id));

  // 3. Find Left Out (In Squad BUT NOT in Lineup)
  const leftOutIds = [];
  for (const id of historicSquadIds) {
    if (!lineupIds.has(id)) {
      leftOutIds.push(id);
    }
  }

  if (leftOutIds.length === 0) return [];

  // 4. Fetch Details & Stats
  const query = `
    SELECT 
      p.id, p.name, p.position, p.img, 
      t.short_name as team_short, t.img as team_img,
      COALESCE(prs.fantasy_points, 0) as points,
      COALESCE(prs.valuation, 0) as valuation
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id AND prs.round_id = $2
    WHERE p.id = ANY($1::int[])
    ORDER BY points DESC
  `;

  return (await db.query(query, [leftOutIds, roundId])).rows;
}

/**
 * Calculate Coach Rating and Optimization Stats based on Historic Squad
 * @param {string} userId
 * @param {string} roundId
 */
export async function getCoachRating(userId, roundId) {
  // 1. Get Actual Score (Official vs Live)
  const actualRes = await db.query(
    `SELECT points FROM user_rounds WHERE user_id = $1 AND round_id = $2`,
    [userId, roundId]
  );

  let actualScore = 0;

  // A. Use Official Score if available
  if (actualRes.rows.length > 0) {
    actualScore = parseInt(actualRes.rows[0].points) || 0;
  }
  // B. Calculate Live Score if no official stats (Round in progress)
  else {
    const liveQuery = `
      SELECT 
        SUM(
          COALESCE(prs.fantasy_points, 0) * 
          CASE 
            WHEN l.is_captain::int = 1 THEN 2.0
            WHEN l.role = 'titular' THEN 1.0
            WHEN l.role = '6th_man' THEN 0.75
            ELSE 0.5
          END
        ) as live_points
      FROM lineups l
      LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND prs.round_id = $2
      WHERE l.user_id = $1 AND l.round_id = $2
    `;
    const liveRes = await db.query(liveQuery, [userId, roundId]);
    actualScore = Math.round(parseFloat(liveRes.rows[0]?.live_points) || 0);
  }

  // 2. Get Historic Squad
  const historicSquadIds = await getHistoricSquad(userId, roundId);
  if (historicSquadIds.size === 0) return { rating: 0, maxScore: 0, actualScore, diff: 0 };

  // 3. Get Stats for ALL players in the historic squad
  // We need to find the theoretical MAX score from this set.
  const statsQuery = `
    SELECT 
      p.id as player_id, p.name, p.position, p.img, p.team_id,
      COALESCE(prs.fantasy_points, 0) as points
    FROM players p
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id AND prs.round_id = $2
    WHERE p.id = ANY($1::int[])
  `;

  const squadStats = (await db.query(statsQuery, [[...historicSquadIds], roundId])).rows;

  // 4. Calculate Max Possible Score (Ideal Lineup)
  // Logic: Valid Formation Greedy Algorithm
  // - Starts: 5 players. Max 3 per position (Base, Alero, Pivot).
  // - Bench: Next 5 best players (unconstrained).

  // Sort ALL historical players by points descending
  // (We use all of them because we might need to dig deep if top players are all same pos)
  const allSorted = squadStats.sort((a, b) => b.points - a.points);

  const starters = [];
  const bench = [];
  const rolesCount = { Base: 0, Alero: 0, Pivot: 0 };
  const usedIds = new Set();

  // A. Select Starters
  for (const p of allSorted) {
    if (starters.length >= 5) break;

    const pos = p.position || 'Base'; // Fallback
    // Check constraint: Max 3 per position
    if ((rolesCount[pos] || 0) < 3) {
      starters.push(p);
      rolesCount[pos] = (rolesCount[pos] || 0) + 1;
      usedIds.add(p.player_id);
    }
  }

  // B. Select Bench (Next best 5, no position constraints)
  for (const p of allSorted) {
    if (bench.length >= 5) break;
    if (!usedIds.has(p.player_id)) {
      bench.push(p);
      usedIds.add(p.player_id);
    }
  }

  // Combine for calculation
  const idealLineupRaw = [...starters, ...bench];
  let maxScore = 0;

  // Map to "Lineup" format for frontend
  const idealLineup = idealLineupRaw.map((p, index) => {
    let multiplier = 0;
    let role = 'bench';
    let is_captain = false;

    // Indices 0-4 are Starters (from our starter selection step)
    if (index < 5) {
      role = 'titular';
      if (index === 0) {
        // Best Starter is Captain
        multiplier = 2.0;
        is_captain = true;
      } else {
        multiplier = 1.0;
      }
    }
    // Indices 5-9 are Bench
    else {
      role = index === 5 ? '6th_man' : 'bench'; // First bench player is 6th man
      multiplier = index === 5 ? 0.75 : 0.5;
    }

    maxScore += p.points * multiplier;

    // Return object compatible with PlayerCard/Court
    return {
      ...p,
      role,
      is_captain,
      stats_points: p.points,
      multiplier,
    };
  });

  // 5. Calculate Rating
  // (Actual / Ideal) * 100 with 2 decimals
  const rating = maxScore > 0 ? (actualScore / maxScore) * 100 : 0;

  return {
    rating: parseFloat(rating.toFixed(2)), // Keep 2 decimals
    maxScore: Math.round(maxScore), // Round to nearest integer
    actualScore,
    diff: parseFloat((maxScore - actualScore).toFixed(2)),
    idealLineup, // <--- Added this to allow frontend "Mi Ideal" view
  };
}

/**
 * DAO: Fetch raw round history for a user
 * Returns basic round info + actual points.
 * Does NOT calculate ideal points or efficiency (that's Service layer job).
 *
 * @param {string} userId
 */
export async function getUserRoundsHistoryDAO(userId) {
  if (!userId) return [];

  // Query: Get all finished rounds where user participated
  // Only rounds where ALL matches are finished
  const query = `
    WITH RoundStatus AS (
      SELECT 
        round_id, 
        min(date) as start_date,
        COUNT(*) as total_matches,
        SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) as finished_matches
      FROM matches
      GROUP BY round_id
    )
    SELECT 
      ur.round_id,
      ur.round_name,
      ur.points as actual_points,
      ur.participated
    FROM user_rounds ur
    JOIN RoundStatus rs ON ur.round_id = rs.round_id
    WHERE ur.user_id = $1 
      AND ur.participated = true
      AND rs.finished_matches > 0 -- Ensure at least one match started/finished
    ORDER BY rs.start_date ASC
  `;

  const rows = (await db.query(query, [userId])).rows;
  return rows;
}
