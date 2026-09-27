import { expect, it, vi } from 'vitest';
const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { query: { hoopgridChallenges: { findFirst } } } }));
import { HoopgridRepository } from '../server/repositories/hoopgrid.repository';
import { hoopgridChallenges } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

it('reads the latest challenge by descending game date without filtering inactive challenges', async () => {
  const row = { gameDate: '2026-09-27', isActive: false };
  findFirst.mockResolvedValue(row);
  expect(await new HoopgridRepository().findLatestChallenge()).toBe(row);
  expect(findFirst).toHaveBeenCalledWith({ orderBy: desc(hoopgridChallenges.gameDate) });
});
