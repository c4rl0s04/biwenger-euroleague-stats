import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const query = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/client', () => ({ pgClient: { query } }));
import { queryHighestTransfer, queryBiggestGain } from './activity-records.query';
it('preserves source tables, season bindings and descending record queries without mutations', async () => {
  query.mockResolvedValue({ rows: [] });
  expect(await queryHighestTransfer('season-A')).toBeNull();
  expect(await queryBiggestGain('season-A')).toBeNull();
  const [transfer, gain] = query.mock.calls;
  expect(transfer[1]).toEqual(['season-A']);
  expect(gain[1]).toEqual(['season-A']);
  expect(transfer[0]).toContain('FROM fichajes f');
  expect(transfer[0]).toContain('ORDER BY f.precio DESC');
  expect(gain[0]).toContain('WHERE ps.season_id = $1 AND ps.price_increment > 0');
  expect(gain[0]).toContain('ORDER BY ps.price_increment DESC');
  for (const [sql] of query.mock.calls) {
    expect(sql).toContain('LIMIT 1');
    expect(sql).not.toMatch(/INSERT|UPDATE|DELETE/);
  }
});
