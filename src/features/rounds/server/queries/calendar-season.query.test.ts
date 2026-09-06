import { afterEach, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: vi.fn() }));

import { resolveReadSeasonId } from '@/lib/db/season-context';
import { resolveCalendarSeasonId } from './calendar-season.query';

afterEach(() => vi.resetAllMocks());

it('delegates to existing default-season validation on each invocation without caching', async () => {
  vi.mocked(resolveReadSeasonId)
    .mockResolvedValueOnce('2025-2026')
    .mockResolvedValueOnce('2026-2027');
  expect(await resolveCalendarSeasonId()).toBe('2025-2026');
  expect(await resolveCalendarSeasonId()).toBe('2026-2027');
  expect(vi.mocked(resolveReadSeasonId).mock.calls).toEqual([[], []]);
});

it('propagates the original validation error unchanged', async () => {
  const error = Object.assign(new Error('Season unavailable'), { code: 'SEASON_NOT_FOUND' });
  vi.mocked(resolveReadSeasonId).mockRejectedValueOnce(error);
  await expect(resolveCalendarSeasonId()).rejects.toBe(error);
});
