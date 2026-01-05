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
      SELECT p.id, p.name, p.position, t.name as team, p.price, p.puntos as points
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.name LIKE ?
      ORDER BY p.puntos DESC
      LIMIT ?
    `
    )
    .all(searchTerm, limit);

  // Search teams (distinct teams from players)
  const teams = db
    .prepare(
      `
      SELECT 
        t.id,
        t.name,
        COUNT(p.id) as player_count
      FROM teams t
      LEFT JOIN players p ON t.id = p.team_id
      WHERE t.name LIKE ?
      GROUP BY t.id, t.name
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
