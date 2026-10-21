import { beforeEach, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ pool: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
import { readManagerSquad } from './manager-squad.query';

beforeEach(() => {
  vi.clearAllMocks();
  fake.season.mockResolvedValue('2026-27');
});

it('prefers the matched official image for the selected season with a Biwenger fallback', async () => {
  const rows = [{ id: 1, img: 'https://official.example/player.png' }];
  fake.query.mockResolvedValue({ rows });
  expect(await readManagerSquad('7')).toEqual({ seasonId: '2026-27', rows });
  const [query, params] = fake.query.mock.calls[0];
  const sql = query.replace(/\s+/g, ' ');
  expect(params).toEqual(['2026-27', '7']);
  expect(sql).toContain('COALESCE(opm.image_url, p.img) AS img');
  expect(sql).toContain('opm.player_id = p.id AND opm.season_id = ps.season_id');
  expect(sql).toContain("opm.provider = 'euroleague_advanced' AND opm.status = 'matched'");
  expect(sql).toContain('LEFT JOIN official_player_mappings');
  expect(sql).toContain('WHERE ps.season_id = $1 AND ps.owner_id = $2');
});
