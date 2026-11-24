import type { TransferDecision } from '../../api/biwenger-board-transfer';
import type { PgPool } from '../client';
import { prepareMarketMutations } from './market';

export async function saveBoardTransfer(
  entry: Extract<TransferDecision, { kind: 'transfer' }>,
  pool: Pick<PgPool, 'connect'>,
  seasonId: string
): Promise<void> {
  const client = await pool.connect();
  let discarded = false;
  try {
    if (!('query' in client))
      throw new Error('A PostgreSQL client is required to save a board transfer.');
    await client.query('BEGIN');
    const mutations = prepareMarketMutations(client, { seasonId });
    const result = await mutations.insertTransfer(entry.transfer);
    if (result.created && result.id) {
      for (const bid of entry.bids) {
        await mutations.insertBid({ transfer_id: result.id, ...bid });
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    if ('query' in client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        discarded = true;
        client.release(true);
      }
    }
    throw error;
  } finally {
    if (!discarded) client.release();
  }
}
