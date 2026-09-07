import 'server-only';
import { pgClient } from '@/lib/db/connection';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type { ManagerContributorRecord } from './manager-contributors.records';

export async function readManagerContributors(userId: string): Promise<ManagerContributorRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      p.id as player_id,
      p.name as player_name,
      p.img as player_img,
      SUM(prs.fantasy_points) as total_base_points,
      SUM(CASE
        WHEN l.role IN ('titular', '6th_man') AND l.is_captain = TRUE THEN prs.fantasy_points * 2
        WHEN l.role IN ('titular', '6th_man') THEN prs.fantasy_points
        ELSE 0
      END) as total_contribution,
      COUNT(prs.round_id) as games_played
    FROM lineups l
    JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id AND prs.season_id = l.season_id
    JOIN players p ON l.player_id = p.id
    WHERE l.season_id = $2 AND l.user_id = $1
    GROUP BY p.id, p.name, p.img
    ORDER BY total_contribution DESC
  `;
  return (await pgClient.query(query, [userId, seasonId])).rows;
}
