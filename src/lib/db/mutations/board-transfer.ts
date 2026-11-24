import type { TransferDecision } from '../../api/biwenger-board-transfer';
import type { MarketMutations } from './market';

export async function saveBoardTransfer(
  entry: Extract<TransferDecision, { kind: 'transfer' }>,
  mutations: Pick<MarketMutations, 'insertTransfer' | 'insertBid'>
): Promise<void> {
  const result = await mutations.insertTransfer(entry.transfer);
  if (!result.created || !result.id) return;
  for (const bid of entry.bids) {
    try {
      await mutations.insertBid({ transfer_id: result.id, ...bid });
    } catch {
      // The scheduled sync treats individual bid writes as best effort.
    }
  }
}
