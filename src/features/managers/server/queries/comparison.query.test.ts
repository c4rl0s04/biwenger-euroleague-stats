import { expect, it, vi, beforeEach } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ pool: { query: mocks.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));
import { readComparisonManagers, readComparisonSquad } from './comparison.query';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.season.mockResolvedValue('fixture-season');
  mocks.query.mockResolvedValue({ rows: [] });
});
it('keeps directory status semantics and name-only ordering', async () => {
  await readComparisonManagers();
  const [sql, params] = mocks.query.mock.calls[0];
  expect(sql).toContain("us.status <> 'inactive'");
  expect(sql).toMatch(/ORDER BY us.name ASC\s*$/);
  expect(params).toEqual(['fixture-season']);
});
it('binds original IDs and season, preserving joins, aggregation and ordering', async () => {
  await readComparisonSquad('07');
  const [sql, params] = mocks.query.mock.calls[0];
  expect(params).toEqual(['07', 'fixture-season']);
  expect(sql).toContain('prs.season_id = ps.season_id');
  expect(sql).toContain('AVG(COALESCE(prs.fantasy_points, 0))');
  expect(sql).toContain('ps.owner_id = $1');
  expect(sql).toContain('ORDER BY points DESC');
});
it('does not query when season resolution fails', async () => {
  mocks.season.mockRejectedValue(new Error('fixture season failure'));
  await expect(readComparisonManagers()).rejects.toThrow('fixture season failure');
  expect(mocks.query).not.toHaveBeenCalled();
});
