import { db } from '../client.js';
import { FUTURE_MATCH_CONDITION } from '../sql_utils.js';

/**
 * Get upcoming matches
 * @param {number} limit - Number of matches to return
 * @returns {Promise<Array>} List of upcoming matches
 */
export async function getUpcomingMatches(limit = 5) {
  const query = `
    SELECT 
      m.id,
      m.date,
      th.name as home_team,
      ta.name as away_team,
      m.round_name
    FROM matches m
    LEFT JOIN teams th ON m.home_id = th.id
    LEFT JOIN teams ta ON m.away_id = ta.id
    WHERE m.status = 'scheduled' 
      AND ${FUTURE_MATCH_CONDITION('m.date')}
    ORDER BY m.date ASC
    LIMIT $1
  `;
  return (await db.query(query, [limit])).rows;
}

/**
 * Get finished matches from the last 24 hours
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRecentResults(limit = 5) {
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
      LIMIT $1
    `;
  return (await db.query(query, [limit])).rows;
}
