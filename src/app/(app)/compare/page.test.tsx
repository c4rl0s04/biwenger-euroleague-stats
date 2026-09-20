import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  phone: vi.fn(),
  auth: vi.fn(),
  data: vi.fn(),
  guard: vi.fn(),
  opponent: vi.fn(),
}));
vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: mocks.phone }));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: mocks.guard }));
vi.mock('@/features/compare/server', () => ({
  getCompareDataLite: mocks.data,
  mapCompareOpponent: mocks.opponent,
}));
vi.mock('@/features/compare/public', () => ({
  DesktopCompareScreen: () => null,
  MobileCompareScreen: () => null,
  CompareOpponentScreen: () => null,
}));
import ComparePage from './page';
import OpponentPage from './[userId]/page';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.phone.mockResolvedValue(false);
  mocks.auth.mockResolvedValue({ user: { id: '1' } });
  mocks.data.mockResolvedValue({ users: [{ id: '2', name: 'Fixture' }] });
  mocks.guard.mockResolvedValue({ definition: { title: 'Comparativa' } });
  mocks.opponent.mockReturnValue({ current: { id: '1' }, opponent: { id: '2' } });
});
it('keeps desktop client loading without a redundant server data read', async () => {
  await ComparePage();
  expect(mocks.data).not.toHaveBeenCalled();
  expect(mocks.auth).not.toHaveBeenCalled();
});
it('uses the lite service and session on phone', async () => {
  mocks.phone.mockResolvedValue(true);
  const result = await ComparePage();
  expect(mocks.data).toHaveBeenCalledWith();
  expect(result.props.currentUserId).toBe('1');
  expect(result.props.users).toEqual([{ id: '2', name: 'Fixture' }]);
});
it('guards detail before reading and passes the original route ID unchanged', async () => {
  await OpponentPage({ params: Promise.resolve({ userId: '02abc' }) });
  expect(mocks.guard).toHaveBeenCalledWith('/compare/02abc');
  expect(mocks.opponent).toHaveBeenCalledWith(await mocks.data.mock.results[0].value, '02abc', '1');
});
it('does not read when desktop/mobile route guard redirects', async () => {
  mocks.guard.mockRejectedValue(new Error('fixture redirect'));
  await expect(OpponentPage({ params: Promise.resolve({ userId: '2' }) })).rejects.toThrow(
    'fixture redirect'
  );
  expect(mocks.data).not.toHaveBeenCalled();
});
it('preserves the blank missing-manager result', async () => {
  mocks.opponent.mockReturnValue(null);
  expect(await OpponentPage({ params: Promise.resolve({ userId: 'missing' }) })).toBeNull();
});
