import 'server-only';
import { pgClient } from '@/lib/db/client';
import type { HighestTransferRecord, BiggestGainRecord } from '../../models/activity-records';

/** Trusted season comes from the Rounds snapshot so all three record reads share one season. */
export async function queryHighestTransfer(seasonId: string) {
  return (
    (
      await pgClient.query<HighestTransferRecord>(
        `
    SELECT f.precio, p.name as player_name, f.comprador, f.fecha
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    WHERE f.season_id = $1
    ORDER BY f.precio DESC
    LIMIT 1
  `,
        [seasonId]
      )
    ).rows[0] ?? null
  );
}
export async function queryBiggestGain(seasonId: string) {
  return (
    (
      await pgClient.query<BiggestGainRecord>(
        `
    SELECT p.id, p.name, ps.price_increment, ps.owner_id
    FROM players p
    JOIN player_seasons ps ON ps.player_id = p.id
    WHERE ps.season_id = $1 AND ps.price_increment > 0
    ORDER BY ps.price_increment DESC
    LIMIT 1
  `,
        [seasonId]
      )
    ).rows[0] ?? null
  );
}
