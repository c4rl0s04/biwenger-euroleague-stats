import { expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ execute: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ db: { execute: mocks.execute } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));
import { queryLeagueAverage } from './league-average.query';
it('preserves SQL rounding, participation, season, aggregate null and missing-row zero', async () => {
  mocks.season.mockResolvedValue('season-A');
  mocks.execute
    .mockResolvedValueOnce({ rows: [{ avg_points: null }] })
    .mockResolvedValueOnce({ rows: [] });
  expect(await queryLeagueAverage()).toBeNull();
  expect(await queryLeagueAverage()).toBe(0);
  const sql = new PgDialect().sqlToQuery(mocks.execute.mock.calls[0][0]);
  expect(sql.params).toEqual(['season-A']);
  expect(sql.sql).toContain('ROUND(AVG(points), 1)::float');
  expect(sql.sql).toContain('participated = TRUE');
  expect(mocks.season).toHaveBeenCalledTimes(2);
});
