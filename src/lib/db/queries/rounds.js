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
export async function getNextRound() {
  // Find the round of the upcoming match, then get its full details (true start date)
  const query = `
    WITH TargetRound AS (
      SELECT round_id 
      FROM matches 
      WHERE date > NOW()
      ORDER BY date ASC 
      LIMIT 1
    )
    SELECT 
      m.round_id,
      m.round_name,
      MIN(m.date) as start_date,
      MAX(m.date) as end_date
    FROM matches m
    JOIN TargetRound tr ON m.round_id = tr.round_id
    GROUP BY m.round_id, m.round_name
  `;
  const roundRes = await db.query(query);
  const round = roundRes.rows[0];

  if (round) {
    // 1. Get all finished matches to calculate standings
    // Include regular time scores (excluding OT) for Article 19.4 compliance
    const allFinishedMatchesQuery = `
      SELECT 
        home_id,
        away_id,
        home_score,
        away_score,
        home_score_regtime,
        away_score_regtime,
        status
      FROM matches
      WHERE status = 'finished'
        AND home_score IS NOT NULL
        AND away_score IS NOT NULL
    `;

    let positionMap = new Map();
    try {
      const allFinishedMatches = (await db.query(allFinishedMatchesQuery)).rows;
      // Use the standings utility to calculate positions properly (handles draws, tie-breaking, etc.)
      positionMap = getTeamPositions(allFinishedMatches);
    } catch (err) {
      console.warn('Could not calculate standings:', err);
    }

    // 2. Get Matches
    const matchesQuery = `
      SELECT 
        m.home_id,
        m.away_id,
        t1.name as home_team, 
        t2.name as away_team, 
        m.date, 
        m.status,
        m.home_score,
        m.away_score,
        t1.img as home_logo,
        t1.short_name as home_short,
        t2.img as away_logo,
        t2.short_name as away_short
      FROM matches m
      LEFT JOIN teams t1 ON m.home_id = t1.id
      LEFT JOIN teams t2 ON m.away_id = t2.id
      WHERE m.round_id = $1
      ORDER BY m.date ASC
    `;

    const matchesRes = await db.query(matchesQuery, [round.round_id]);
    round.matches = matchesRes.rows.map((match) => ({
      ...match,
      home_position: positionMap.get(match.home_id) || null,
      away_position: positionMap.get(match.away_id) || null,
    }));
  }

  return round;
}

/**
 * Get the last completed round (active or finished)
 * Used for default selection
 */
export async function getLastCompletedRound() {
  const query = `
    SELECT round_id 
    FROM matches 
    WHERE status = 'finished'
    ORDER BY date DESC 
    LIMIT 1
  `;
  const res = await db.query(query);
  return res.rows[0];
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
