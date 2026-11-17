import { beforeEach, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import Page from './page';

const mocks = vi.hoisted(() => ({ workspace: vi.fn(), redirect: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/features/market/server', () => ({ readPersonalBidWorkspace: mocks.workspace }));
vi.mock('@/features/market/public', () => ({ PersonalBidsScreen: () => null }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.redirect.mockImplementation(() => {
    throw new Error('login redirect');
  });
});
it('redirects signed-out visitors before loading provider data', async () => {
  vi.mocked(auth).mockResolvedValue(null as never);
  await expect(Page()).rejects.toThrow('login redirect');
  expect(mocks.redirect).toHaveBeenCalledWith('/login');
  expect(mocks.workspace).not.toHaveBeenCalled();
});
it.each(['7', '8'])(
  'loads the signed-in manager %s without an account allowlist',
  async (userId) => {
    vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as never);
    const data = { market: { listings: [] } };
    mocks.workspace.mockResolvedValue(data);
    const page = await Page();
    expect(mocks.workspace).toHaveBeenCalledWith(userId);
    expect(page.props.initialData).toEqual(data);
    expect(mocks.redirect).not.toHaveBeenCalled();
  }
);
