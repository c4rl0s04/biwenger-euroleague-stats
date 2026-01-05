import { db } from '../client.js';

/**
 * Get upcoming matches
 * @param {number} limit - Number of matches to return
 * @returns {Array} List of upcoming matches
 */
export function getUpcomingMatches(limit = 5) {
  const query = `
    SELECT 
      m.id,
      m.date,
      th.name as home_team,
      ta.name as away_team,
      r.name as round_name
    FROM matches m
    LEFT JOIN teams th ON m.home_id = th.id
    LEFT JOIN teams ta ON m.away_id = ta.id
    LEFT JOIN rounds r ON m.round_id = r.id
    WHERE m.status = 'scheduled' 
      AND m.date > datetime('now')
    ORDER BY m.date ASC
    LIMIT ?
  `;
  return db.prepare(query).all(limit);
}

/**
 * Get finished matches from the last 24 hours
 * @param {number} limit
 * @returns {Array}
 */
export function getRecentResults(limit = 5) {
  const query = `
      SELECT 
        m.id,
        m.date,
        th.name as home_team,
        ta.name as away_team,
        m.home_score,
        m.away_score
      FROM matches m
      LEFT JOIN teams th ON m.home_id = th.id
      LEFT JOIN teams ta ON m.away_id = ta.id
      WHERE m.status = 'finished'
      ORDER BY m.date DESC
      LIMIT ?
    `;
  return db.prepare(query).all(limit);
}
