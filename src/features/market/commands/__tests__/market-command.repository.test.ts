import { PgDialect } from 'drizzle-orm/pg-core';
import { expect, it, vi } from 'vitest';
import { marketCommandRepository } from '../server/repositories/market-command.repository';

const mocks = vi.hoisted(() => ({
  where: vi.fn().mockResolvedValue(undefined),
  returning: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/db/client', () => ({
  db: { update: () => ({ set: () => ({ where: mocks.where }) }) },
}));
vi.mock('@/lib/db/season-context', () => ({
  resolveReadSeasonId: vi.fn().mockResolvedValue('2026-27'),
}));
vi.mock('@/lib/seasons', () => ({ assertWritableSeason: vi.fn() }));

it('requires the acting manager to still own the player in the writable season', async () => {
  mocks.where.mockClear();
  await marketCommandRepository.clearLocalPlayerOwner(42, 'acting-manager');

  expect(mocks.where).toHaveBeenCalledOnce();
  expect(new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0])).toMatchObject({
    sql: '("player_seasons"."season_id" = $1 and "player_seasons"."player_id" = $2 and "player_seasons"."owner_id" = $3)',
    params: ['2026-27', 42, 'acting-manager'],
  });
});

it('declines to clear ownership after the observed row changes', async () => {
  mocks.where.mockReturnValueOnce({ returning: mocks.returning });
  await expect(
    marketCommandRepository.clearConfirmedPlayerOwner(42, 'acting-manager', {
      seasonId: '2026-27',
      version: '12',
    })
  ).resolves.toBe(false);
  expect(new PgDialect().sqlToQuery(mocks.where.mock.lastCall![0])).toMatchObject({
    sql: expect.stringContaining('xmin::text = $4'),
    params: ['2026-27', 42, 'acting-manager', '12'],
  });
});
