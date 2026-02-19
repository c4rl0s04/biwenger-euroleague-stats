import { db } from '../../client';

export interface SearchPlayer {
  id: number;
  name: string;
  position: string;
  team: string;
  price: number;
  points: number;
}

export interface SearchTeam {
  id: number;
  name: string;
  player_count: number;
}

export interface SearchUser {
  id: number;
  name: string;
  icon: string;
}

export interface GlobalSearchResult {
  players: SearchPlayer[];
  teams: SearchTeam[];
  users: SearchUser[];
}

/**
 * Search across players, teams, and users
 * @param query - Search query string
 * @param limit - Max results per category
 * @returns Search results grouped by type
 */
export async function globalSearch(query: string, limit: number = 5): Promise<GlobalSearchResult> {
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
  const playersRes = await db.query(playersQuery, [searchTerm, limit]);
  const players: SearchPlayer[] = playersRes.rows.map((row: any) => ({
    ...row,
    price: parseInt(row.price),
    points: parseInt(row.points),
  }));

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
  const teamsRes = await db.query(teamsQuery, [searchTerm, limit]);
  const teams: SearchTeam[] = teamsRes.rows.map((row: any) => ({
    ...row,
    player_count: parseInt(row.player_count),
  }));

  // Search users by name
  const usersQuery = `
      SELECT id, name, icon
      FROM users
      WHERE name ILIKE $1
      ORDER BY name
      LIMIT $2
  `;
  const usersRes = await db.query(usersQuery, [searchTerm, limit]);
  const users: SearchUser[] = usersRes.rows;

  return {
    players,
    teams,
    users,
  };
}
