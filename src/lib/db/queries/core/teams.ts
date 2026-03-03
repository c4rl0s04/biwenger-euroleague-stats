import { db } from '../../client';

export interface Team {
  id: number;
  name: string;
  short_name: string;
  logo: string;
}

/**
 * Get team details by ID
 */
export async function getTeamById(id: number | string): Promise<Team | undefined> {
  const query = `
    SELECT 
      id,
      name,
      short_name,
      img as logo
    FROM teams
    WHERE id = $1
  `;
  return (await db.query(query, [id])).rows[0];
}

/**
 * Get total matches played by a team in the current season
 * Uses the player_round_stats table as the source of truth for valid rounds
 */
export async function getTeamMatchesCount(teamId: number | string): Promise<number> {
  const numericTeamId = Number(teamId);
  if (isNaN(numericTeamId)) return 0;

  const query = `
    SELECT COUNT(DISTINCT m.id) as count
    FROM matches m
    WHERE (m.home_id = $1 OR m.away_id = $1)
      AND m.date < NOW()
      AND m.round_id IN (SELECT DISTINCT round_id FROM player_round_stats)
  `;

  const res = await db.query(query, [numericTeamId]);
  return parseInt(res.rows[0]?.count || '0', 10);
}
