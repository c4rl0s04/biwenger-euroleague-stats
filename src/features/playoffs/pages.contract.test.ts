import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  detail: vi.fn(),
  overview: vi.fn(),
  phone: vi.fn(),
}));
vi.mock('@/features/playoffs/server', () => ({
  getPlayoffOverview: mocks.overview,
  getPlayoffDetail: mocks.detail,
}));
vi.mock('@/features/playoffs/public', () => ({
  PlayoffClient: () => null,
  MobilePlayoffsScreen: () => null,
  PlayoffDetailScreen: () => null,
}));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: mocks.guard }));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: mocks.phone }));
vi.mock('@/components/ui', () => ({ PageHeader: () => null }));
import Page, { revalidate } from '@/app/(app)/playoffs/page';
import DetailPage from '@/app/(app)/playoffs/predictions/[userId]/page';
beforeEach(() => vi.resetAllMocks());
it('keeps the 600-second page declaration and passes phone presentation to orchestration', async () => {
  const phone = Promise.resolve(true);
  mocks.phone.mockReturnValue(phone);
  mocks.overview.mockResolvedValue({ presentation: 'phone', leaderboard: [] });
  expect((await Page()).props).toEqual({ leaderboard: [] });
  expect(mocks.overview).toHaveBeenCalledWith(phone);
  expect(revalidate).toBe(600);
});
it('preserves redirect/invalid-route failures before any detail read', async () => {
  const error = new Error('fixture framework redirect');
  mocks.guard.mockRejectedValue(error);
  await expect(DetailPage({ params: Promise.resolve({ userId: '7abc' }) })).rejects.toBe(error);
  expect(mocks.guard).toHaveBeenCalledWith('/playoffs/predictions/7abc');
  expect(mocks.detail).not.toHaveBeenCalled();
});
it('passes exact string IDs and preserves null rather than introducing a not-found response', async () => {
  mocks.guard.mockResolvedValue({ definition: { title: 'Predicciones' } });
  mocks.detail.mockResolvedValue(null);
  expect(await DetailPage({ params: Promise.resolve({ userId: '007' }) })).toBeNull();
  expect(mocks.detail).toHaveBeenCalledWith('007');
});
it('composes the detail screen with the registry title and exact service model', async () => {
  mocks.guard.mockResolvedValue({ definition: { title: 'Predicciones' } });
  const model = { user: { userId: '7' }, rows: [] };
  mocks.detail.mockResolvedValue(model);
  expect((await DetailPage({ params: Promise.resolve({ userId: '7' }) }))?.props).toEqual({
    model,
    title: 'Predicciones',
  });
});
