import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: vi.fn() }));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: vi.fn() }));
vi.mock('@/features/rounds/public', () => ({
  MobileRoundsScreen: () => null,
  RoundsScreen: () => null,
  RoundSectionScreen: () => null,
}));
vi.mock('@/features/rounds/server', () => ({
  getRoundOverviewData: vi.fn(),
  getRoundSectionData: vi.fn(),
}));
import { auth } from '@/auth';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getRoundOverviewData, getRoundSectionData } from '@/features/rounds/server';
import { MobileRoundsScreen, RoundsScreen, RoundSectionScreen } from '@/features/rounds/public';
import RoundsPage from '@/app/(app)/rounds/page';
import SectionPage from '@/app/(app)/rounds/[roundId]/[section]/page';

beforeEach(() => vi.clearAllMocks());
describe('Rounds framework adapter contracts', () => {
  it('desktop retains browser-driven loading without new auth/data reads', async () => {
    vi.mocked(isPhonePresentation).mockResolvedValue(false);
    expect((await RoundsPage({ searchParams: Promise.resolve({ roundId: '8' }) })).type).toBe(
      RoundsScreen
    );
    expect(auth).not.toHaveBeenCalled();
    expect(getRoundOverviewData).not.toHaveBeenCalled();
  });
  it('phone forwards explicit query and session identity without coercion', async () => {
    vi.mocked(isPhonePresentation).mockResolvedValue(true);
    vi.mocked(auth).mockResolvedValue({ user: { id: '7' } } as never);
    const result = await RoundsPage({ searchParams: Promise.resolve({ roundId: '007abc' }) });
    expect(result.type).toBe(MobileRoundsScreen);
    expect(getRoundOverviewData).toHaveBeenCalledWith('7', '007abc');
  });
  it('preserves repeated query values at runtime instead of selecting or rejecting an ID', async () => {
    vi.mocked(isPhonePresentation).mockResolvedValue(true);
    vi.mocked(auth).mockResolvedValue({ user: { id: '7' } } as never);
    const roundId = ['1', '2'];
    // Framework inputs can exceed the legacy single-ID type. Characterize the
    // existing passthrough without introducing a new validation policy here.
    await RoundsPage({ searchParams: Promise.resolve({ roundId }) as never });
    expect(getRoundOverviewData).toHaveBeenCalledWith('7', roundId);
  });
  it('section guard redirects/not-found before auth or queries', async () => {
    const marker = new Error('framework redirect');
    vi.mocked(requireMobileRoute).mockRejectedValue(marker);
    await expect(
      SectionPage({ params: Promise.resolve({ roundId: 'bad', section: 'unknown' }) })
    ).rejects.toBe(marker);
    expect(auth).not.toHaveBeenCalled();
    expect(getRoundSectionData).not.toHaveBeenCalled();
  });
  it('section uses existing registry title and passes IDs unchanged', async () => {
    vi.mocked(requireMobileRoute).mockResolvedValue({
      definition: { title: 'Historial' },
    } as never);
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await SectionPage({
      params: Promise.resolve({ roundId: '07abc', section: 'history' }),
    });
    expect(result.type).toBe(RoundSectionScreen);
    expect(result.props.title).toBe('Historial');
    expect(getRoundSectionData).toHaveBeenCalledWith('07abc', 'history', undefined);
  });
});
