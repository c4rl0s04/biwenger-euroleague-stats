import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { full } = vi.hoisted(() => ({ full: vi.fn() }));
vi.mock('./base-standings.service', () => ({ getFullStandings: full }));
import { getRequestStandings } from './request-standings.service';
it('shares the exact request-cache function between Home and shell callers', async () => {
  expect(readFileSync('src/app/(app)/layout.js', 'utf8')).toContain(
    "import { getRequestStandings } from '@/features/standings/server'"
  );
  full.mockResolvedValue([]);
  expect(await getRequestStandings()).toEqual([]);
  expect(full).toHaveBeenCalledWith();
});
