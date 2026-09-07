import { db as pgClient } from '../../client';
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
      u.id,
      COALESCE(us.name, u.name) AS name,
      COALESCE(us.icon, u.icon) AS icon,
      COALESCE(us.color_index, u.color_index, 0) AS color_index
    FROM user_seasons us
    JOIN users u ON u.id = us.user_id
    WHERE us.season_id = $1
      AND COALESCE(us.status, 'active') = 'active'
    ORDER BY COALESCE(us.name, u.name) ASC, u.id ASC
  `,
    [seasonId]
  );
  return result.rows as ManagerDirectoryRow[];
}
