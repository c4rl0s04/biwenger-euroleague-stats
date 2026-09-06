import 'server-only';

import { pgClient } from '@/lib/db/connection';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type { SearchRecords } from './search.records';

/**
 * Search across players, teams, and users
 * @param query - Search query string
 * @param limit - Max results per category
 * @returns Search results grouped by type
 */
export async function findSearchRecords(query: string, limit: number): Promise<SearchRecords> {
  const seasonId = await resolveReadSeasonId();
  const searchTerm = `%${query.trim()}%`;
  // Postgres uses ILIKE for case-insensitive matching

  // Search players by name
  const playersQuery = `
      SELECT
        p.id,
        p.name,
        COALESCE(opm.image_url,p.img) AS img,
        p.position,
        t.name as team,
        COALESCE(ps.price, p.price) as price,
        COALESCE(ps.puntos, p.puntos) as points
      FROM players p
      JOIN player_seasons ps ON ps.player_id = p.id
      LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
      LEFT JOIN official_player_mappings opm
        ON opm.player_id=p.id AND opm.season_id=ps.season_id
       AND opm.provider='euroleague_advanced' AND opm.status='matched'
      WHERE p.name ILIKE $1 
        AND ps.season_id = $2
        AND p.name IS NOT NULL 
        AND COALESCE(opm.image_url,p.img) IS NOT NULL
        AND COALESCE(ps.team_id, p.team_id) IS NOT NULL
      ORDER BY COALESCE(ps.puntos, p.puntos) DESC
      LIMIT $3
  `;
  const playersRes = await pgClient.query(playersQuery, [searchTerm, seasonId, limit]);

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

  return {
    players: playersRes.rows,
    teams: teamsRes.rows,
    users: usersRes.rows,
  };
}
