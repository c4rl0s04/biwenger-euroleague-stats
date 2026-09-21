import 'server-only';
import { pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type { HighestRoundRecord } from '../../models/last-round';

export async function queryHighestRoundSnapshot() {
  const seasonId = await resolveReadSeasonId();
  const result = await pgClient.query<HighestRoundRecord>(
    `
    SELECT ur.user_id, us.name as user_name, ur.round_name, ur.points
    FROM user_rounds ur
    JOIN user_seasons us ON us.user_id = ur.user_id AND us.season_id = ur.season_id
    WHERE ur.season_id = $1 AND ur.participated = TRUE
    ORDER BY ur.points DESC
    LIMIT 1
  `,
    [seasonId]
  );
  return { seasonId, record: result.rows[0] ?? null };
}
