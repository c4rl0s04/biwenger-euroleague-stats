import 'server-only';
import type { Pool } from 'pg';
import { db as client } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type {
  ManagerIdentityRecord,
  ManagerTotalsRecord,
  ManagerPositionsRecord,
  ManagerTransfersRecord,
  ManagerTransferRecord,
  ManagerSeasonRecords,
} from './manager.records';
const pgClient = client as Pool;

export async function readManagerSeasonStats(
  userId: number | string
): Promise<ManagerSeasonRecords> {
  const seasonId = await resolveReadSeasonId();
  // First get user details for name
  const userRes = await pgClient.query(
    `
    SELECT
      COALESCE(us.name, u.name) AS name,
      COALESCE(us.icon, u.icon) AS icon,
      COALESCE(us.color_index, u.color_index, 0) AS color_index
    FROM users u
    LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = $2
    WHERE u.id = $1
  `,
    [userId, seasonId]
  );
  const user = userRes.rows[0] as ManagerIdentityRecord | undefined;

  const statsQuery = `
    WITH UserRounds AS (
      SELECT 
        user_id,
        points,
        participated
      FROM user_rounds
      WHERE season_id = $2 AND user_id = $1 AND participated = TRUE
    )
    SELECT 
      COALESCE(SUM(points), 0) as total_points,
      COALESCE(MAX(points), 0) as best_round,
      COALESCE(MIN(points), 0) as worst_round,
      COALESCE(ROUND(AVG(points), 1), 0) as average_points,
      COUNT(*) as rounds_played
    FROM UserRounds
  `;

  const statsRes = await pgClient.query(statsQuery, [userId, seasonId]);
  const stats = statsRes.rows[0] as ManagerTotalsRecord | undefined;

  const positionsQuery = `
    WITH RoundPositions AS (
      SELECT 
        ur.round_id,
        ur.user_id,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE ur.season_id = $2 AND ur.participated = TRUE
    )
    SELECT 
      MIN(position) as best_position,
      MAX(position) as worst_position,
      ROUND(AVG(position), 1) as average_position,
      COUNT(CASE WHEN position = 1 THEN 1 END) as victories,
      COUNT(CASE WHEN position <= 3 THEN 1 END) as podiums
    FROM RoundPositions
    WHERE user_id = $1
  `;

  // Transfers query
  const transfersQuery = `
    SELECT
      COUNT(CASE WHEN comprador = $1 THEN 1 END) as purchases,
      COUNT(CASE WHEN vendedor = $2 THEN 1 END) as sales,
      SUM(CASE WHEN comprador = $1 THEN precio ELSE 0 END) as total_spent,
      SUM(CASE WHEN vendedor = $2 THEN precio ELSE 0 END) as total_received
    FROM fichajes
    WHERE season_id = $3
  `;

  const positionsRes = await pgClient.query(positionsQuery, [userId, seasonId]);
  const positions = positionsRes.rows[0] as ManagerPositionsRecord | undefined;

  let transfers: ManagerTransfersRecord = {
    purchases: 0,
    sales: 0,
    total_spent: 0,
    total_received: 0,
    last_transfers: [] as ManagerTransferRecord[],
  };
  if (user) {
    const transfersRes = await pgClient.query(transfersQuery, [user.name, user.name, seasonId]);
    transfers = (transfersRes.rows[0] as ManagerTransfersRecord | undefined) || transfers;

    // Get last 3 transfers
    const lastTransfersQuery = `
      SELECT 
        f.player_id,
        p.name as player_name,
        f.precio as price,
        f.comprador,
        f.vendedor,
        f.fecha,
        CASE WHEN f.comprador = $1 THEN 'purchase' ELSE 'sale' END as type
      FROM fichajes f
      LEFT JOIN players p ON f.player_id = p.id
      WHERE f.season_id = $2 AND (f.comprador = $1 OR f.vendedor = $1)
      ORDER BY f.fecha DESC, f.id DESC
      LIMIT 3
    `;
    const lastTransfersRes = await pgClient.query(lastTransfersQuery, [user.name, seasonId]);
    transfers.last_transfers = lastTransfersRes.rows as ManagerTransferRecord[];
  }

  return { user, stats, positions, transfers };
}
