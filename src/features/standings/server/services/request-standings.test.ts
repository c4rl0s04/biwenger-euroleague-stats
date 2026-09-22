import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { full } = vi.hoisted(() => ({ full: vi.fn() }));
vi.mock('./base-standings.service', () => ({ getFullStandings: full }));
vi.mock('@/lib/seasons', () => ({ listAvailableSeasons: vi.fn(), getActiveSeasonId: vi.fn() }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: vi.fn() }));
// Limit the legacy shell adapter's dependency to the real contract under test.
vi.mock('@/features/standings/server', async () => await import('./request-standings.service'));
import { getRequestStandings } from './request-standings.service';
import { getAppStandings } from '@/lib/services/app/appShellService';
it('shares the exact request-cache function between Home contract and the shell adapter', async () => {
  expect(getAppStandings).toBe(getRequestStandings);
  full.mockResolvedValue([]);
  expect(await getRequestStandings()).toEqual([]);
  expect(full).toHaveBeenCalledWith();
});
