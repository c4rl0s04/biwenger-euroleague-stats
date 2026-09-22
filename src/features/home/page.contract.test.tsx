import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  phone: vi.fn(),
  auth: vi.fn(),
  redirect: vi.fn((url: string): never => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: mocks.phone }));
vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/features/home/public', async () => ({
  ...(await import('./validation/activity-filter')),
  DesktopHome: () => null,
}));
vi.mock('@/features/home/server', () => ({ MobileHomeScreen: () => null }));
import Home from '@/app/(app)/page';
import { DesktopHome } from './public';
import { MobileHomeScreen } from './server';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.phone.mockResolvedValue(true);
  mocks.auth.mockResolvedValue({ user: { id: '007' } });
});
it('retains desktop composition without adding page-level identity resolution', async () => {
  mocks.phone.mockResolvedValue(false);
  const result = await Home({ searchParams: Promise.resolve({ activity: 'bonuses' }) });
  expect(result.type).toBe(DesktopHome);
  expect(mocks.auth).not.toHaveBeenCalled();
});
it('uses the phone session ID and first repeated activity value', async () => {
  const result = await Home({
    searchParams: Promise.resolve({ activity: ['transfers', 'results'] }),
  });
  expect(result.type).toBe(MobileHomeScreen);
  expect(result.props).toEqual({ userId: '007', initialFilter: 'transfers' });
});
it('defaults unknown phone filters without tightening validation', async () => {
  expect(
    (await Home({ searchParams: Promise.resolve({ activity: 'invalid' }) })).props.initialFilter
  ).toBe('all');
});
it('retains the legacy phone bonuses redirect and unrelated first query values', async () => {
  await expect(
    Home({ searchParams: Promise.resolve({ activity: ['bonuses', 'all'], other: ['one', 'two'] }) })
  ).rejects.toThrow('redirect:/?activity=rounds&other=one');
});
it('retains the exact anonymous phone redirect', async () => {
  mocks.auth.mockResolvedValue(null);
  await expect(Home({ searchParams: Promise.resolve({}) })).rejects.toThrow(
    'redirect:/login?callbackUrl=%2F'
  );
});
