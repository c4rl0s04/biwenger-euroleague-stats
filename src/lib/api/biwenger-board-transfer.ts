import type { InsertBidParams, InsertTransferParams } from '../db/mutations/market';

interface BoardTransfer {
  player: number;
  amount?: number;
  from?: { name: string } | null;
  to?: { name: string } | null;
  bids?: Array<{
    user?: { id?: string | number; name?: string } | string | number | null;
    amount?: number;
  } | null>;
}

type BoardBid = Omit<InsertBidParams, 'transfer_id'>;
export type TransferDecision =
  | { kind: 'ignored' | 'invalid-actor' }
  | { kind: 'transfer'; transfer: InsertTransferParams; bids: BoardBid[]; missingPlayer: boolean };

export function interpretBoardTransfer(
  content: BoardTransfer,
  timestamp: number,
  date: string,
  context: {
    playersList: Readonly<Record<string, unknown>>;
    teamNames: ReadonlySet<string>;
    validUserNames: ReadonlySet<string>;
  }
): TransferDecision {
  const from = content.from ? content.from.name : 'Mercado';
  const to = content.to ? content.to.name : 'Mercado';
  if (
    (from === 'Mercado' && to === 'Mercado') ||
    context.teamNames.has(from) ||
    context.teamNames.has(to)
  )
    return { kind: 'ignored' };

  if (
    (from !== 'Mercado' && !context.validUserNames.has(from)) ||
    (to !== 'Mercado' && !context.validUserNames.has(to))
  )
    return { kind: 'invalid-actor' };

  const bids: BoardBid[] = [];
  if (Array.isArray(content.bids)) {
    for (const bid of content.bids) {
      if (!bid) continue;
      try {
        const user = bid.user;
        const objectUser = user && typeof user === 'object' ? user : null;
        const bidderId = objectUser?.id || user;
        bids.push({
          bidder_id: bidderId ? bidderId.toString() : null,
          bidder_name: objectUser?.name || 'Unknown',
          amount: bid.amount || 0,
        });
      } catch {
        // Preserve the board sync’s best-effort handling of malformed bids.
      }
    }
  }

  return {
    kind: 'transfer',
    transfer: {
      timestamp,
      fecha: date,
      player_id: content.player,
      precio: content.amount || 0,
      vendedor: from,
      comprador: to,
    },
    bids,
    missingPlayer: !context.playersList[content.player],
  };
}
