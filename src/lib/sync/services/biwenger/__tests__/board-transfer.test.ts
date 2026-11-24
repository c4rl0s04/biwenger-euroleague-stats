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

it('rolls back a failed bid, retries the movement and skips bids on a duplicate', async () => {
  const entry = interpretBoardTransfer(movement, timestamp, date, context);
  if (entry.kind !== 'transfer') throw new Error('Fixture must produce a transfer');
  expect(entry.missingPlayer).toBe(true);
  let failBid = true;
  let duplicate = false;
  const query = vi.fn(async (sql: string, _params?: unknown[]) => {
    if (sql.includes('INSERT INTO fichajes')) {
      return duplicate ? { rows: [], rowCount: 0 } : { rows: [{ id: 12 }], rowCount: 1 };
    }
    if (failBid && sql.includes('INSERT INTO transfer_bids'))
      throw new Error('fixture write failure');
    return { rows: [], rowCount: 0 };
  });
  const release = vi.fn();
  const connect = vi.fn().mockResolvedValue({ query, release });
  await expect(saveBoardTransfer(entry, { connect }, '2025-26')).rejects.toThrow(
    'fixture write failure'
  );
  expect(query.mock.calls.map(([sql]) => sql.trim().split(/\s+/).slice(0, 3).join(' '))).toEqual([
    'BEGIN',
    'INSERT INTO fichajes',
    'INSERT INTO transfer_bids',
    'ROLLBACK',
  ]);
  failBid = false;
  await saveBoardTransfer(entry, { connect }, '2025-26');
  duplicate = true;
  await saveBoardTransfer(entry, { connect }, '2025-26');
  expect(
    query.mock.calls
      .filter(([sql]) => sql.includes('INSERT INTO transfer_bids'))
      .map(([, params]) => params)
  ).toEqual([
    ['2025-26', 12, '7', 'Buyer', 200],
    ['2025-26', 12, '7', 'Buyer', 200],
    ['2025-26', 12, '8', 'Unknown', 150],
  ]);
  expect(release).toHaveBeenCalledTimes(3);
});
