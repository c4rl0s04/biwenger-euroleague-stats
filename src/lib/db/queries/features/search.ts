import { db, pgClient } from '../../index';
import { resolveReadSeasonId } from '../../season-context';

export interface SearchPlayer {
  id: number;
  name: string;
  img: string;
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

  const seasonId = await resolveReadSeasonId();
  const searchTerm = `%${query.trim()}%`;
  // Postgres uses ILIKE for case-insensitive matching

  // Search players by name
  const playersQuery = `
      SELECT
        p.id,
        p.name,
        p.img,
        p.position,
        t.name as team,
        COALESCE(ps.price, p.price) as price,
        COALESCE(ps.puntos, p.puntos) as points
      FROM players p
      JOIN player_seasons ps ON ps.player_id = p.id
      LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
      WHERE p.name ILIKE $1 
        AND ps.season_id = $2
        AND p.name IS NOT NULL 
        AND p.img IS NOT NULL 
        AND COALESCE(ps.team_id, p.team_id) IS NOT NULL
      ORDER BY COALESCE(ps.puntos, p.puntos) DESC
      LIMIT $3
  `;
  const playersRes = await pgClient.query(playersQuery, [searchTerm, seasonId, limit]);
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
        COUNT(ps.player_id) as player_count
      FROM teams t
      LEFT JOIN player_seasons ps ON ps.team_id = t.id AND ps.season_id = $2
      WHERE t.name ILIKE $1
      GROUP BY t.id, t.name
      ORDER BY player_count DESC
      LIMIT $3
  `;
  const teamsRes = await pgClient.query(teamsQuery, [searchTerm, seasonId, limit]);
  const teams: SearchTeam[] = teamsRes.rows.map((row: any) => ({
    ...row,
    player_count: parseInt(row.player_count),
  }));

  // Search users by name
  const usersQuery = `
      SELECT
        u.id,
        COALESCE(us.name, u.name) as name,
        COALESCE(us.icon, u.icon) as icon
      FROM user_seasons us
      JOIN users u ON u.id = us.user_id
      WHERE COALESCE(us.name, u.name) ILIKE $1
        AND us.season_id = $2
        AND COALESCE(us.status, 'active') = 'active'
      ORDER BY COALESCE(us.name, u.name)
      LIMIT $3
  `;
  const usersRes = await pgClient.query(usersQuery, [searchTerm, seasonId, limit]);
  const users: SearchUser[] = usersRes.rows;

  return {
    players,
    teams,
    users,
  };
}
