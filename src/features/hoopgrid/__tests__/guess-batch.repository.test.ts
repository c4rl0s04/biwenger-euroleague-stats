import { beforeEach, expect, it, vi } from 'vitest';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/lib/db', async () => {
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { Client } = await import('pg');
  const client = new Client();
  client.query = query;
  return { db: drizzle(client) };
});

import { HoopgridRepository } from '../server/repositories/hoopgrid.repository';

const guesses = [0, 1].map((cellIndex) => ({
  challengeId: 'challenge',
  userId: 'manager',
  cellIndex,
  playerId: 42 + cellIndex,
  isCorrect: true,
}));

beforeEach(() => query.mockReset());

it('rolls back the transaction when the second guess write fails', async () => {
  const failure = new Error('injected write failure');
  query
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [['guess', 'challenge', 'manager', 0, 42, true, null]] })
    .mockRejectedValueOnce(failure)
    .mockResolvedValueOnce({ rows: [] });

  await expect(new HoopgridRepository().upsertGuesses(guesses)).rejects.toMatchObject({
    cause: failure,
  });

  const statements = query.mock.calls.map(([statement]) => statement.text);
  expect(statements).toEqual([
    'begin',
    expect.stringMatching(/^insert into "hoopgrid_guesses"/),
    expect.stringMatching(/^insert into "hoopgrid_guesses"/),
    'rollback',
  ]);
});
