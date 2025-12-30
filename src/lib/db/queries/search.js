import { db } from '../client.js';

/**
 * Search across players, teams, and users
 * @param {string} query - Search query string
 * @param {number} limit - Max results per category
 * @returns {Object} Search results grouped by type
 */
export function globalSearch(query, limit = 5) {
  if (!query || query.trim().length < 2) {
    return { players: [], teams: [], users: [] };
  }

  const searchTerm = `%${query.trim()}%`;

  // Search players by name
  const players = db
    .prepare(
      `
      SELECT id, name, position, team, price, puntos as points
      FROM players
      WHERE name LIKE ?
      ORDER BY puntos DESC
      LIMIT ?
    `
    )
    .all(searchTerm, limit);

  // Search teams (distinct teams from players)
  const teams = db
    .prepare(
      `
      SELECT 
        team as name,
        COUNT(*) as player_count
      FROM players
      WHERE team LIKE ?
      GROUP BY team
      ORDER BY player_count DESC
      LIMIT ?
    `
    )
    .all(searchTerm, limit);

  // Search users by name
  const users = db
    .prepare(
      `
      SELECT id, name, icon
      FROM users
      WHERE name LIKE ?
      ORDER BY name
      LIMIT ?
    `
    )
    .all(searchTerm, limit);

  return {
    players,
    teams,
    users,
  };
}
