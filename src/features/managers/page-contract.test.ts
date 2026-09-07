import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  section: vi.fn(),
  phone: vi.fn(),
  guard: vi.fn(),
}));
vi.mock('@/features/managers/server', () => ({
  getManagerProfile: mocks.profile,
  getManagerProfileSection: mocks.section,
}));
vi.mock('@/features/managers/public', () => ({
  ManagerProfileScreen: () => null,
  ManagerProfileSectionScreen: () => null,
}));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: mocks.phone }));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: mocks.guard }));
import ManagerPage, { dynamic } from '@/app/(app)/user/[id]/page';
import ManagerSectionPage from '@/app/(app)/user/[id]/[section]/page';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.profile.mockResolvedValue({ kind: 'missing', presentation: 'desktop' });
  mocks.section.mockResolvedValue({ context: 'Manager', rows: [] });
  mocks.guard.mockResolvedValue({ definition: { title: 'Temporada' } });
});

describe('Manager Profile page adapters', () => {
  it.each([true, false])(
    'resolves presentation %s and forwards unchanged ID to service',
    async (phone) => {
      mocks.phone.mockResolvedValue(phone);
      const page = await ManagerPage({ params: Promise.resolve({ id: '007abc' }) });
      expect(mocks.profile).toHaveBeenCalledExactlyOnceWith('007abc', phone ? 'phone' : 'desktop');
      expect(page.props.result).toEqual({ kind: 'missing', presentation: 'desktop' });
      expect(dynamic).toBe('force-dynamic');
    }
  );
  it('awaits presentation before starting data reads', async () => {
    let release!: (phone: boolean) => void;
    mocks.phone.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );
    const pending = ManagerPage({ params: Promise.resolve({ id: '7' }) });
    await Promise.resolve();
    expect(mocks.profile).not.toHaveBeenCalled();
    release(true);
    await pending;
    expect(mocks.profile).toHaveBeenCalledWith('7', 'phone');
  });
  it.each(['season', 'squad', 'evolution', 'contributors', 'competitions'])(
    'preserves guarded section %s and back URL',
    async (section) => {
      const result = await ManagerSectionPage({ params: Promise.resolve({ id: '007', section }) });
      expect(mocks.guard).toHaveBeenCalledExactlyOnceWith(`/user/007/${section}`);
      expect(mocks.section).toHaveBeenCalledExactlyOnceWith('007', section);
      expect(mocks.guard.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.section.mock.invocationCallOrder[0]
      );
      expect(result.props).toEqual({
        title: 'Temporada',
        data: { context: 'Manager', rows: [] },
        backHref: '/user/007',
      });
    }
  );
  it.each(['redirect', 'not-found'])(
    'does not read when existing guard raises %s',
    async (kind) => {
      const error = new Error(kind);
      mocks.guard.mockRejectedValue(error);
      await expect(
        ManagerSectionPage({ params: Promise.resolve({ id: '7', section: 'unknown' }) })
      ).rejects.toBe(error);
      expect(mocks.section).not.toHaveBeenCalled();
    }
  );
  it('propagates service failure to existing framework boundary', async () => {
    const error = new Error('synthetic read failure');
    mocks.profile.mockRejectedValue(error);
    await expect(ManagerPage({ params: Promise.resolve({ id: '7' }) })).rejects.toBe(error);
    mocks.section.mockRejectedValue(error);
    await expect(
      ManagerSectionPage({ params: Promise.resolve({ id: '7', section: 'season' }) })
    ).rejects.toBe(error);
  });
});
