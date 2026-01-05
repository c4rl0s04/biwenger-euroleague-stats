import { db } from '../client.js';
import { getTeamPositions } from '../../utils/standings.js';

/**
 * Get Porras statistics
 * @returns {Array} User statistics from prediction game
 */
export function getPorrasStats() {
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

  return db.prepare(query).all();
}

/**
 * Get all Porras rounds
 * @returns {Array} All rounds with results
 */
export function getAllPorrasRounds() {
  const query = `
    SELECT 
      jornada,
      usuario,
      aciertos
    FROM porras
    ORDER BY jornada DESC, aciertos DESC
  `;

  return db.prepare(query).all();
}

/**
 * Get the next upcoming round
 * @returns {Object} Next round details
 */
export function getNextRound() {
  // Find the round of the upcoming match, then get its full details (true start date)
  const query = `
    WITH NextMatchRound AS (
      SELECT round_id
      FROM matches
      WHERE date > datetime('now')
      ORDER BY date ASC
      LIMIT 1
    )
    SELECT 
      m.round_id,
      m.round_name,
      MIN(m.date) as start_date,
      MAX(m.date) as end_date
    FROM matches m
    JOIN NextMatchRound nm ON m.round_id = nm.round_id
    GROUP BY m.round_id
  `;
  const round = db.prepare(query).get();

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
      const allFinishedMatches = db.prepare(allFinishedMatchesQuery).all();
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
      WHERE m.round_id = ? 
      ORDER BY m.date ASC
    `;

    round.matches = db
      .prepare(matchesQuery)
      .all(round.round_id)
      .map((match) => ({
        ...match,
        home_position: positionMap.get(match.home_id) || null,
        away_position: positionMap.get(match.away_id) || null,
      }));
  }

  return round;
}

/**
 * Get the winner of the last completed round
 * @returns {Object} User who won the last round
 */
export function getLastRoundWinner() {
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
      AND ur.participated = 1
    ORDER BY ur.points DESC
    LIMIT 1
  `;
  return db.prepare(query).get();
}

/**
 * Get user's recent rounds performance
 * @param {string} userId - User ID
 * @param {number} limit - Number of rounds
 * @returns {Array} Recent rounds with position
 */
export function getUserRecentRounds(userId, limit = 10) {
  // Get all rounds (including non-participated) with position when participated
  const query = `
    WITH AllRounds AS (
      SELECT DISTINCT round_id, round_name
      FROM user_rounds
      ORDER BY round_id DESC
      LIMIT ?
    ),
    RoundPositions AS (
      SELECT 
        ur.round_id,
        ur.user_id,
        ur.points,
        ur.participated,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE ur.participated = 1
    )
    SELECT 
      ar.round_id,
      ar.round_name,
      COALESCE(rp.points, 0) as points,
      COALESCE(rp.position, 0) as position,
      CASE WHEN rp.user_id IS NOT NULL THEN 1 ELSE 0 END as participated
    FROM AllRounds ar
    LEFT JOIN RoundPositions rp ON ar.round_id = rp.round_id AND rp.user_id = ?
    ORDER BY ar.round_id DESC
  `;

  const rounds = db.prepare(query).all(limit, userId);

  // Count total rounds where user participated
  const countQuery = `
    SELECT COUNT(*) as total_played
    FROM user_rounds
    WHERE user_id = ? AND participated = 1
  `;
  const { total_played } = db.prepare(countQuery).get(userId) || { total_played: 0 };

  // Count total rounds in the season (distinct round_ids)
  const totalRoundsQuery = `
    SELECT COUNT(DISTINCT round_id) as total_rounds
    FROM user_rounds
  `;
  const { total_rounds } = db.prepare(totalRoundsQuery).get() || { total_rounds: 0 };

  return { rounds, total_played, total_rounds };
}

/**
 * Get best performers from the last completed round
 * @param {number} limit - Number of MVPs
 * @returns {Array} Top MVPs from last round
 */
export function getLastRoundMVPs(limit = 5) {
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
      u.name as owner_name
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE prs.round_id = (SELECT last_round_id FROM LastRound)
    ORDER BY prs.fantasy_points DESC
    LIMIT ?
  `;

  return db.prepare(query).all(limit);
}

/**
 * Get all player stats for the last completed round to calculate ideal lineup
 * @returns {Array} List of players with their stats for the last round
 */
export function getLastRoundStats() {
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
  return db.prepare(query).all();
}
