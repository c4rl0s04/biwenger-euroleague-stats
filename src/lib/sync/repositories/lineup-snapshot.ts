import type { Pool } from 'pg';
import { prepareUserMutations, type UpsertLineupParams } from '../../db/mutations/users';

/** Pin all replacement writes to one connection, preserving the last snapshot on failure. */
export async function replaceLineupSnapshot(
  pool: Pick<Pool, 'connect'>,
  seasonId: string,
  userId: string,
  roundId: number,
  rows: UpsertLineupParams[]
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const mutations = prepareUserMutations(client, { seasonId });
    await mutations.deleteUserLineup({ user_id: userId, round_id: roundId });
    for (const row of rows) await mutations.upsertLineup(row);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
