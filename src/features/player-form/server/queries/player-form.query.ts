import 'server-only';
import { pgClient } from '@/lib/db/connection';
export { resolveReadSeasonId as resolvePlayerFormSeason } from '@/lib/db/season-context';

export interface PlayerFormRow {
  player_id: number | string;
  recent_scores: string | null;
  avg_recent_points: string | null;
}

export async function readPlayerFormRows(
  limit: number,
  seasonId: string
): Promise<PlayerFormRow[]> {
  const query = `
    WITH RecentMatchInfo AS (
      SELECT
        t.id AS team_id,
        m.round_id,
        m.date AS match_date,
        ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY m.date DESC) AS team_rn
      FROM teams t
      JOIN matches m ON (m.home_id = t.id OR m.away_id = t.id)
      WHERE m.season_id = $2 AND m.status = 'finished'
    )
    SELECT
      p.id AS player_id,
      STRING_AGG(
        COALESCE(CAST(prs.fantasy_points AS TEXT), 'X'),
        ',' ORDER BY rmi.match_date DESC
      ) AS recent_scores,
      AVG(prs.fantasy_points) AS avg_recent_points
    FROM players p
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $2
    JOIN RecentMatchInfo rmi ON COALESCE(ps.team_id, p.team_id) = rmi.team_id
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id AND rmi.round_id = prs.round_id AND prs.season_id = $2
    WHERE rmi.team_rn <= $1
    GROUP BY p.id
  `;

  return (await pgClient.query(query, [limit, seasonId])).rows as PlayerFormRow[];
}
