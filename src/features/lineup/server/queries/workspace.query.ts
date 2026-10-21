import 'server-only';
import { pool } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type { LineupWorkspacePlayer } from '../../models/workspace';

type Row = Omit<LineupWorkspacePlayer, 'recent_scores' | 'detailsAvailable'>;
export async function readWorkspacePlayers(ids: string[]): Promise<Row[]> {
  if (!ids.length) return [];
  const seasonId = await resolveReadSeasonId();
  const result = await pool.query<Row>(
    `
    SELECT p.id, p.name, ps.position, t.name AS team, t.img AS team_img,
      t.short_name AS team_short_name, COALESCE(opm.image_url, p.img) AS img,
      ps.price, ps.price_increment, ps.puntos AS points,
      ROUND(CAST(ps.puntos AS NUMERIC) / NULLIF(ps.partidos_jugados, 0), 1) AS average
    FROM players p
    LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $1
    LEFT JOIN teams t ON t.id = ps.team_id
    LEFT JOIN official_player_mappings opm ON opm.player_id = p.id AND opm.season_id = $1
      AND opm.provider = 'euroleague_advanced' AND opm.status = 'matched'
    WHERE p.id = ANY($2::int[])
  `,
    [seasonId, ids]
  );
  return result.rows;
}
