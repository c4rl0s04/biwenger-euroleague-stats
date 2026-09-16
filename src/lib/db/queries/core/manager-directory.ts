import { pool as pgClient } from '../../client';
import { resolveReadSeasonId } from '../../season-context';

/** Shared fantasy-manager directory projection, never account/credential records.
 * Rounds and legacy directory consumers share this single query. Keeping this
 * small projection below features avoids Managers -> Players -> Teams -> Matches
 * -> Rounds -> Managers; it does not migrate the unrelated directory screen.
 */
export interface ManagerDirectoryRow {
  id: string;
  name: string | null;
  icon: string | null;
  color_index: number;
}

export async function readManagerDirectory(): Promise<ManagerDirectoryRow[]> {
  const seasonId = await resolveReadSeasonId();
  const result = await pgClient.query(
    `
    SELECT
      us.user_id AS id,
      us.name,
      us.icon,
      us.color_index
    FROM user_seasons us
    WHERE us.season_id = $1
      AND us.status = 'active'
    ORDER BY us.name ASC, us.user_id ASC
  `,
    [seasonId]
  );
  return result.rows as ManagerDirectoryRow[];
}
