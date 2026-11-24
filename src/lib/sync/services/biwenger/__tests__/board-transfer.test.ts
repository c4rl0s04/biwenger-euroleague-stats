import { expect, it, vi } from 'vitest';
import { interpretBoardTransfer } from '../../../../api/biwenger-board-transfer';
import { saveBoardTransfer } from '../../../../db/mutations/board-transfer';

const context = {
  playersList: {},
  teamNames: new Set(['Real Madrid']),
  validUserNames: new Set(['Seller', 'Buyer']),
};
const date = '2025-10-05T20:16:05.000Z';
const timestamp = Date.parse(date) / 1000;
const movement = {
  player: 42,
  from: { name: 'Seller' },
  to: { name: 'Buyer' },
  amount: 200,
  bids: [null, { user: { id: 7, name: 'Buyer' }, amount: 200 }, { user: 8, amount: 150 }],
};

it('classifies ignored and unrecognized participants', () => {
  const classify = (from?: { name: string }, to?: { name: string }) =>
    interpretBoardTransfer({ player: 42, from, to }, timestamp, date, context);
  expect(classify()).toEqual({ kind: 'ignored' });
  expect(classify({ name: 'Real Madrid' })).toEqual({ kind: 'ignored' });
  expect(classify({ name: 'Unknown' })).toEqual({ kind: 'invalid-actor' });
});

it('writes the canonical movement once and keeps later bids after an individual failure', async () => {
  const entry = interpretBoardTransfer(movement, timestamp, date, context);
  if (entry.kind !== 'transfer') throw new Error('Fixture must produce a transfer');
  expect(entry.missingPlayer).toBe(true);
  const insertTransfer = vi
    .fn()
    .mockResolvedValueOnce({ created: true, id: 12 })
    .mockResolvedValueOnce({ created: false, id: null });
  const insertBid = vi.fn().mockRejectedValueOnce(new Error('fixture write failure'));
  await saveBoardTransfer(entry, { insertTransfer, insertBid });
  await saveBoardTransfer(entry, { insertTransfer, insertBid });
  expect(insertTransfer).toHaveBeenCalledWith({
    timestamp,
    fecha: date,
    player_id: 42,
    precio: 200,
    vendedor: 'Seller',
    comprador: 'Buyer',
  });
  expect(insertBid.mock.calls).toEqual([
    [{ transfer_id: 12, bidder_id: '7', bidder_name: 'Buyer', amount: 200 }],
    [{ transfer_id: 12, bidder_id: '8', bidder_name: 'Unknown', amount: 150 }],
  ]);
});
