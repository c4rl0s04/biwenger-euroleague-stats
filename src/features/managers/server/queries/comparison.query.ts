import 'server-only';
import { pool } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export interface ComparisonManagerRow {
  id: string | number;
  name: string | null;
  icon: string | null;
  color_index: number | null;
}
export interface ComparisonSquadRow {
  id: number;
  name: string | null;
  position: string | null;
  team: string | null;
  price: string | number | null;
  points: string | number | null;
  average: string | number | null;
  status: string | null;
}

/** Deliberately distinct from the active-only directory: preserves <> inactive and name-only ordering. */
export async function readComparisonManagers(): Promise<ComparisonManagerRow[]> {
  const seasonId = await resolveReadSeasonId();
  return (
    await pool.query(
      `
    SELECT us.user_id as id, us.name, us.icon, us.color_index
    FROM user_seasons us
    WHERE us.season_id = $1 AND us.status <> 'inactive'
    ORDER BY us.name ASC
  `,
      [seasonId]
    )
  ).rows;
}
export async function readComparisonSquad(userId: string | number): Promise<ComparisonSquadRow[]> {
  const seasonId = await resolveReadSeasonId();
  return (
    await pool.query(
      `
    SELECT
      p.id,
      p.name,
      ps.position,
      t.name as team,
      ps.price AS price,
      COALESCE(SUM(prs.fantasy_points), 0) as points,
      ROUND(AVG(COALESCE(prs.fantasy_points, 0)), 1) as average,
      ps.status AS status
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON ps.team_id = t.id
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id AND prs.season_id = ps.season_id
    WHERE ps.season_id = $2 AND ps.owner_id = $1
    GROUP BY p.id, p.name, ps.position, t.name, ps.price, ps.status
    ORDER BY points DESC
  `,
      [userId, seasonId]
    )
  ).rows;
}
