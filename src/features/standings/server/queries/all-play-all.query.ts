import 'server-only';

import { pgClient } from '@/lib/db/connection';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type {
  AllPlayAllRoundRecord,
  AllPlayAllUserRecord,
  AllPlayAllScoreRecord,
} from './all-play-all.records';

export const resolveAllPlayAllSeason = () => resolveReadSeasonId();

export async function listAllPlayAllRounds(seasonId: string): Promise<AllPlayAllRoundRecord[]> {
  return (
    await pgClient.query<AllPlayAllRoundRecord>(
      'SELECT DISTINCT round_id FROM user_rounds WHERE season_id = $1 AND participated = TRUE',
      [seasonId]
    )
  ).rows;
}

export async function listAllPlayAllUsers(seasonId: string): Promise<AllPlayAllUserRecord[]> {
  return (
    await pgClient.query<AllPlayAllUserRecord>(
      `
          SELECT
            u.id,
            COALESCE(us.name, u.name) as name,
            COALESCE(us.icon, u.icon) as icon,
            COALESCE(us.color_index, u.color_index, 0) as color_index
          FROM user_seasons us
          JOIN users u ON u.id = us.user_id
          WHERE us.season_id = $1
            AND COALESCE(us.status, 'active') = 'active'
        `,
      [seasonId]
    )
  ).rows;
}

export async function listAllPlayAllScores(
  roundId: number | null,
  seasonId: string
): Promise<AllPlayAllScoreRecord[]> {
  return (
    await pgClient.query<AllPlayAllScoreRecord>(
      'SELECT user_id, points FROM user_rounds WHERE season_id = $2 AND round_id = $1 AND participated = TRUE',
      [roundId, seasonId]
    )
  ).rows;
}
