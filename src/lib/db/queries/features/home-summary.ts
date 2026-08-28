import 'server-only';

import { db as pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export interface HomeSeasonMetadata {
  id: string;
  name: string;
  status: string;
  completedRounds: number;
}

export async function queryHomeSeasonMetadata(): Promise<HomeSeasonMetadata> {
  const seasonId = await resolveReadSeasonId();
  const result = await pgClient.query(
    `
      SELECT
        s.id,
        s.name,
        s.status,
        COUNT(DISTINCT ur.round_id)::int AS completed_rounds
      FROM seasons s
      LEFT JOIN user_rounds ur
        ON ur.season_id = s.id AND COALESCE(ur.participated, TRUE) = TRUE
      WHERE s.id = $1
      GROUP BY s.id, s.name, s.status
    `,
    [seasonId]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    completedRounds: Number(row.completed_rounds ?? 0),
  };
}
