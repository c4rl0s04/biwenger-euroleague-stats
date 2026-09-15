import 'server-only';
import type { Pool } from 'pg';
import { db as client } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type { ManagerSquadRecord } from './manager.records';
const pgClient = client as Pool;

export async function readManagerSquad(userId: number | string) {
  const seasonId = await resolveReadSeasonId();
  const squadQuery = `
    SELECT
      p.id,
      p.name,
      ps.position,
      t.name as team,
      t.img as team_img,
      t.short_name as team_short_name,
      ps.price AS price,
      ps.price_increment AS price_increment,
      ps.puntos as points,
      ROUND(CAST(ps.puntos AS NUMERIC) / NULLIF(ps.partidos_jugados, 0), 1) as average,
      p.img
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON ps.team_id = t.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2
    ORDER BY ps.puntos DESC NULLS LAST
  `;

  const squadRes = await pgClient.query<ManagerSquadRecord>(squadQuery, [seasonId, userId]);
  return { seasonId, rows: squadRes.rows };
}

export async function readManagerPoints(userId: number | string, seasonId: string) {
  const userPointsQuery = `
    SELECT COALESCE(SUM(points), 0) as total_points
    FROM user_rounds
    WHERE season_id = $1 AND user_id = $2 AND participated = TRUE
  `;
  const userPointsRes = await pgClient.query<{ total_points: number | string | null }>(
    userPointsQuery,
    [seasonId, userId]
  );
  const userPoints = userPointsRes.rows[0];

  return userPoints?.total_points || 0;
}
