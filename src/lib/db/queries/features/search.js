import { db } from '../../client.js';

/**
 * Search across players, teams, and users
 * @param {string} query - Search query string
 * @param {number} limit - Max results per category
 * @returns {Promise<Object>} Search results grouped by type
 */
export async function globalSearch(query, limit = 5) {
  if (!query || query.trim().length < 2) {
    return { players: [], teams: [], users: [] };
  }

  const searchTerm = `%${query.trim()}%`;
  // Postgres uses ILIKE for case-insensitive matching

  // Search players by name
  const playersQuery = `
      SELECT p.id, p.name, p.position, t.name as team, p.price, p.puntos as points
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.name ILIKE $1
      ORDER BY p.puntos DESC
      LIMIT $2
  `;
  const players = (await db.query(playersQuery, [searchTerm, limit])).rows;

  // Search teams (distinct teams from players)
  const teamsQuery = `
      SELECT 
        t.id,
        t.name,
        COUNT(p.id) as player_count
      FROM teams t
      LEFT JOIN players p ON t.id = p.team_id
      WHERE t.name ILIKE $1
      GROUP BY t.id, t.name
      ORDER BY player_count DESC
      LIMIT $2
  `;
  const teams = (await db.query(teamsQuery, [searchTerm, limit])).rows;

  // Search users by name
  const usersQuery = `
      SELECT id, name, icon
      FROM users
      WHERE name ILIKE $1
      ORDER BY name
      LIMIT $2
  `;
  const users = (await db.query(usersQuery, [searchTerm, limit])).rows;

  return {
    players,
    teams,
    users,
  };
}
