import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/index', () => ({ db: {}, pgClient: {} }));
vi.mock('@/features/standings/server/services/all-play-all.service', () => ({
  fetchAllPlayAllStats: async () => [
    {
      user_id: '1',
      name: null,
      icon: null,
      color_index: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      pct: null,
    },
  ],
}));
import { getAllPlayAllStats } from '@/lib/db/queries/analytics/advanced_stats';

it('legacy adapter preserves NaN for existing server/mobile consumers', async () => {
  const rows = await getAllPlayAllStats();
  expect(rows[0].user_id).toBe('1');
  expect(Number.isNaN(rows[0].pct)).toBe(true);
  expect(JSON.parse(JSON.stringify(rows))[0].pct).toBeNull();
});
it('keeps typed models independent, queries guarded, and the mixed route only partially migrated', () => {
  const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  expect(read('src/features/standings/models/all-play-all.ts')).not.toMatch(/import|\bany\b/);
  expect(
    read('src/features/standings/server/queries/all-play-all.query.ts').startsWith(
      "import 'server-only';"
    )
  ).toBe(true);
  expect(read('src/features/standings/server/queries/all-play-all.query.ts')).toContain(
    "from '@/lib/db/connection'"
  );
  const route = read('src/app/api/standings/advanced/route.ts');
  expect(route).toContain("from '@/features/standings/server'");
  expect(route).not.toContain("from '@/lib/services'");
  expect(route).not.toMatch(/export const (dynamic|revalidate)/);
});
