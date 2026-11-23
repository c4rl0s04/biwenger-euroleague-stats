import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('not-found');
  }),
}));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: vi.fn() }));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: vi.fn() }));
vi.mock('@/lib/seasons/server', () => ({
  getRequestSeasonContext: vi.fn(async () => ({
    currentSeasonId: '2026-27',
    activeSeasonId: '2026-27',
    seasons: [{ id: '2026-27', name: 'EuroLeague Fantasy 2026-27' }],
  })),
}));
vi.mock('@/features/season-predictions/public', () => ({
  MobileSeasonPredictionsHub: () => null,
  SeasonPredictionsHub: () => null,
  SeasonPredictionsSectionScreen: () => null,
  isHubSection: (value: string) => ['preseason', 'playoffs', 'leaderboard'].includes(value),
}));
vi.mock('@/features/season-predictions/server', () => ({
  getSeasonPredictionsHub: vi.fn(async () => ({ seasonId: '2026-27' })),
}));
import { auth } from '@/auth';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getSeasonPredictionsHub } from '@/features/season-predictions/server';
import {
  MobileSeasonPredictionsHub,
  SeasonPredictionsHub,
  SeasonPredictionsSectionScreen,
} from '@/features/season-predictions/public';
import HubPage from '@/app/(app)/season-predictions/page';
import SectionPage from '@/app/(app)/season-predictions/[section]/page';

beforeEach(() => vi.clearAllMocks());

describe('Season predictions hub framework adapters', () => {
  it('redirects anonymous visitors to login before reading predictions', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(HubPage()).rejects.toThrow('redirect:/login');
    expect(getSeasonPredictionsHub).not.toHaveBeenCalled();
  });

  it('reads the hub for the session member and picks the composition by presentation', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '7' } } as never);
    vi.mocked(isPhonePresentation).mockResolvedValue(false);
    expect((await HubPage()).type).toBe(SeasonPredictionsHub);
    vi.mocked(isPhonePresentation).mockResolvedValue(true);
    expect((await HubPage()).type).toBe(MobileSeasonPredictionsHub);
    expect(getSeasonPredictionsHub).toHaveBeenCalledWith('2026-27', '7');
  });

  it('rejects unknown sections before the mobile guard, auth or queries', async () => {
    await expect(SectionPage({ params: Promise.resolve({ section: 'bracket' }) })).rejects.toThrow(
      'not-found'
    );
    expect(requireMobileRoute).not.toHaveBeenCalled();
    expect(auth).not.toHaveBeenCalled();
  });

  it('renders a known section for the session member after the mobile guard', async () => {
    vi.mocked(requireMobileRoute).mockResolvedValue({} as never);
    vi.mocked(auth).mockResolvedValue({ user: { id: '7' } } as never);
    const result = await SectionPage({ params: Promise.resolve({ section: 'leaderboard' }) });
    expect(requireMobileRoute).toHaveBeenCalledWith('/season-predictions/leaderboard');
    expect(result.type).toBe(SeasonPredictionsSectionScreen);
    expect(result.props.section).toBe('leaderboard');
    expect(getSeasonPredictionsHub).toHaveBeenCalledWith('2026-27', '7');
  });
});
