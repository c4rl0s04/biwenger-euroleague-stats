import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/connection', () => ({ pgClient: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
import { readManagerContributors } from './manager-contributors.query';

beforeEach(() => {
  vi.clearAllMocks();
  fake.season.mockResolvedValue('2026-27');
  fake.query.mockResolvedValue({ rows: [] });
});
describe('manager contributors query', () => {
  it('preserves lineup contribution formulas, joins and unbounded tie ordering', async () => {
    await readManagerContributors('007abc');
    expect(fake.season).toHaveBeenCalledWith();
    expect(fake.query).toHaveBeenCalledTimes(1);
    const [query, params] = fake.query.mock.calls[0];
    const sql = query.replace(/\s+/g, ' ').trim();
    expect(params).toEqual(['007abc', '2026-27']);
    expect(sql).toContain('SUM(prs.fantasy_points) as total_base_points');
    expect(sql).toContain(
      "WHEN l.role IN ('titular', '6th_man') AND l.is_captain = TRUE THEN prs.fantasy_points * 2"
    );
    expect(sql).toContain("WHEN l.role IN ('titular', '6th_man') THEN prs.fantasy_points ELSE 0");
    expect(sql).toContain('COUNT(prs.round_id) as games_played');
    expect(sql).toContain('prs.season_id = l.season_id');
    expect(sql).toContain('WHERE l.season_id = $2 AND l.user_id = $1');
    expect(sql).toMatch(/GROUP BY p.id, p.name, p.img ORDER BY total_contribution DESC$/);
    expect(sql).not.toContain('LIMIT');
    expect(sql).not.toContain('participated');
    expect(fake.season.mock.invocationCallOrder[0]).toBeLessThan(
      fake.query.mock.invocationCallOrder[0]
    );
  });
  it('returns raw projection rows for the mapper and does not cache', async () => {
    const rows = [{ player_id: 1, total_contribution: '12' }];
    fake.query.mockResolvedValue({ rows });
    expect(await readManagerContributors('7')).toBe(rows);
    await readManagerContributors('7');
    expect(fake.season).toHaveBeenCalledTimes(2);
    expect(fake.query).toHaveBeenCalledTimes(2);
  });
  it('propagates season and query failures without fallback', async () => {
    const error = new Error('fixture failure');
    fake.season.mockRejectedValueOnce(error);
    await expect(readManagerContributors('7')).rejects.toBe(error);
    expect(fake.query).not.toHaveBeenCalled();
    fake.query.mockRejectedValueOnce(error);
    await expect(readManagerContributors('7')).rejects.toBe(error);
  });
});
