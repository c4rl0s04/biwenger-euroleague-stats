import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ pool: { query: mocks.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));
import { queryHomeSeasonMetadata } from './home-summary.query';
it('uses the resolved season and maps only season metadata with the original participation predicate', async () => {
  mocks.season.mockResolvedValue('old-season');
  mocks.query.mockResolvedValue({
    rows: [
      { id: 'old-season', name: 'Old', status: 'frozen', completed_rounds: '3', extra: 'unused' },
    ],
  });
  expect(await queryHomeSeasonMetadata()).toEqual({
    id: 'old-season',
    name: 'Old',
    status: 'frozen',
    completedRounds: 3,
  });
  const [sql, params] = mocks.query.mock.calls[0];
  expect(params).toEqual(['old-season']);
  expect(sql).toContain('COALESCE(ur.participated, TRUE) = TRUE');
  expect(sql).toContain('COUNT(DISTINCT ur.round_id)');
});
it('keeps missing-season failures visible rather than manufacturing an empty season', async () => {
  mocks.query.mockResolvedValue({ rows: [] });
  await expect(queryHomeSeasonMetadata()).rejects.toThrow();
});
