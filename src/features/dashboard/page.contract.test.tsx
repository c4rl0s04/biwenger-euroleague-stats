import { beforeEach, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  phone: vi.fn(),
  auth: vi.fn(),
  guard: vi.fn(),
  personal: vi.fn(),
  league: vi.fn(),
  next: vi.fn(),
  news: vi.fn(),
}));
vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: mocks.phone }));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: mocks.guard }));
vi.mock('@/features/dashboard/server', () => ({
  getUserDashboardData: mocks.personal,
  getLeagueDashboardData: mocks.league,
  getNextRoundData: mocks.next,
}));
vi.mock('@/features/news/server', () => ({ fetchNewsFeed: mocks.news }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/components/ui', () => ({ CardSkeleton: () => null, PageHeader: () => null }));
vi.mock('@/components/layout', () => ({ Section: () => null }));
vi.mock('@/features/dashboard/public', async () => ({
  DesktopDashboardScreen: () => createElement('main', {}, 'Desktop Dashboard'),
  MobileDashboardScreen: ({ data }: { data: { managerName: string } }) =>
    createElement('main', {}, data.managerName),
  MobileDashboardSectionScreen: (await import('./screens/MobileDashboardSectionScreen')).default,
  toMobileDashboardViewModel: (await import('./mappers/mobile-dashboard.mapper'))
    .toMobileDashboardViewModel,
}));
vi.mock('@/components/mobile/MobileDetailScaffold', () => ({
  default: ({ children }: { children: ReactNode }) => createElement('main', {}, children),
}));
vi.mock('@/components/mobile/MobileScreen', () => ({
  MobileListRow: ({ title, trailing }: { title: string; trailing?: ReactNode }) =>
    createElement('div', {}, title, ':', trailing),
  MobileMetric: ({ label, value }: { label: string; value: ReactNode }) =>
    createElement('div', {}, label, ':', value),
  MobileMetricGrid: ({ children }: { children: ReactNode }) => createElement('div', {}, children),
  MobileSectionHeading: ({ children }: { children: ReactNode }) =>
    createElement('h2', {}, children),
}));
import Section from '@/app/(app)/dashboard/[section]/page';
import Overview from '@/app/(app)/dashboard/page';

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.phone.mockResolvedValue(true);
  mocks.auth.mockResolvedValue({ user: { id: '007' } });
  mocks.guard.mockResolvedValue({ definition: { title: 'Section' } });
  mocks.personal.mockResolvedValue({
    seasonStats: { name: 'Manager', total_points: 100 },
    captainStats: { extra_points: 45, avg_points: 9 },
    squadDetails: { player_count: 5 },
  });
  mocks.league.mockResolvedValue({
    leagueAverage: null,
    hotStreaks: [],
    coldStreaks: [],
    roundMVPs: [],
  });
  mocks.next.mockResolvedValue({
    nextRound: null,
    captainRecommendations: [],
    marketOpportunities: [],
  });
  mocks.news.mockResolvedValue([]);
});
it('desktop delegates to its screen without phone service calls or identity reads', async () => {
  mocks.phone.mockResolvedValue(false);
  expect(renderToStaticMarkup(await Overview())).toContain('Desktop Dashboard');
  for (const mock of [mocks.auth, mocks.personal, mocks.league, mocks.next, mocks.news])
    expect(mock).not.toHaveBeenCalled();
});
it('phone overview resolves identity once and composes the existing service projections', async () => {
  expect(renderToStaticMarkup(await Overview())).toContain('Manager');
  expect(mocks.auth).toHaveBeenCalledTimes(1);
  expect(mocks.personal).toHaveBeenCalledWith('007');
  expect(mocks.next).toHaveBeenCalledWith('007');
  expect(mocks.league).toHaveBeenCalledTimes(1);
  expect(mocks.news).toHaveBeenCalledTimes(1);
});
it('phone overview retains missing-session fallbacks without a personal read', async () => {
  mocks.auth.mockResolvedValue(null);
  expect(renderToStaticMarkup(await Overview())).toContain('Tu equipo');
  expect(mocks.personal).not.toHaveBeenCalled();
  expect(mocks.next).toHaveBeenCalledWith(null);
});
it.each(['personal', 'league', 'next', 'news'] as const)(
  'preserves overview %s failure propagation',
  async (name) => {
    mocks[name].mockRejectedValue(new Error('read failure'));
    await expect(Overview()).rejects.toThrow('read failure');
  }
);
it('honors the section guard before identity or data reads', async () => {
  mocks.guard.mockRejectedValue(new Error('route boundary'));
  await expect(Section({ params: Promise.resolve({ section: 'invalid' }) })).rejects.toThrow(
    'route boundary'
  );
  expect(mocks.auth).not.toHaveBeenCalled();
  expect(mocks.personal).not.toHaveBeenCalled();
});
it.each(['season', 'comparison', 'next-round', 'market', 'league'])(
  'preserves bounded reads for the %s section',
  async (section) => {
    const markup = renderToStaticMarkup(await Section({ params: Promise.resolve({ section }) }));
    expect(mocks.guard).toHaveBeenCalledWith('/dashboard/' + section);
    if (section === 'season' || section === 'comparison') {
      expect(mocks.personal).toHaveBeenCalledWith('007');
      expect(mocks.league).not.toHaveBeenCalled();
      expect(mocks.next).not.toHaveBeenCalled();
    } else if (section === 'league') {
      expect(mocks.league).toHaveBeenCalledTimes(1);
      expect(mocks.personal).not.toHaveBeenCalled();
      expect(mocks.next).not.toHaveBeenCalled();
    } else {
      expect(mocks.next).toHaveBeenCalledWith('007');
      expect(mocks.personal).not.toHaveBeenCalled();
      expect(mocks.league).not.toHaveBeenCalled();
    }
    if (section === 'season') {
      expect(markup).toContain('Puntos como capitán:0');
      expect(markup).toContain('Acierto medio:0%');
    }
  }
);
