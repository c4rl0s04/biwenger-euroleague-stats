import { expect, it, vi } from 'vitest';
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ pool: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
import { readWorkspacePlayers } from '../queries/workspace.query';
it('enriches IDs independently of synced ownership and isolates the official photo by season', async () => {
  fake.season.mockResolvedValue('2026-27');
  fake.query.mockResolvedValue({ rows: [{ id: 7 }] });
  expect(await readWorkspacePlayers(['7', '9'])).toEqual([{ id: 7 }]);
  const [query, params] = fake.query.mock.calls[0];
  const sql = query.replace(/\s+/g, ' ');
  expect(params).toEqual(['2026-27', ['7', '9']]);
  expect(sql).toContain('WHERE p.id = ANY($2::int[])');
  expect(sql).toContain('ps.season_id = $1');
  expect(sql).toContain('opm.season_id = $1');
  expect(sql).toContain('COALESCE(opm.image_url, p.img)');
  expect(sql).not.toContain('owner_id');
});
