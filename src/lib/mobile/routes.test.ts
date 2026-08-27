import { describe, expect, it } from 'vitest';

import {
  MOBILE_ROUTE_DEFINITIONS,
  findMobileRoute,
  getDesktopDestination,
} from './routes';

describe('mobile route registry', () => {
  it('contains unique paths and excludes the internal Hoopgrid route', () => {
    const paths = MOBILE_ROUTE_DEFINITIONS.map((route) => route.href);

    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.some((path) => path.includes('test-hoopgrid'))).toBe(false);
  });

  it('maps analytic subpages to the equivalent desktop section', () => {
    expect(getDesktopDestination('/standings/progression')).toBe('/standings#progression');
    expect(getDesktopDestination('/market/bids')).toBe('/market#bids');
    expect(getDesktopDestination('/season-review/methodology')).toBe(
      '/season-review#methodology'
    );
  });

  it('preserves meaningful route state when redirecting desktop users', () => {
    expect(getDesktopDestination('/assistant/thread-7')).toBe(
      '/assistant?conversation=thread-7'
    );
    expect(getDesktopDestination('/compare/23')).toBe('/compare?opponent=23');
    expect(getDesktopDestination('/rounds/12/stats')).toBe('/rounds?roundId=12#stats');
  });

  it('matches parameterized routes and exposes their navigation metadata', () => {
    const route = findMobileRoute('/player/42/performance');

    expect(route?.definition.title).toBe('Rendimiento');
    expect(route?.params).toEqual({ id: '42' });
    expect(route?.definition.parentHref).toBe('/player/[id]');
  });

  it('returns no desktop redirect for primary production screens', () => {
    expect(getDesktopDestination('/dashboard')).toBeNull();
    expect(getDesktopDestination('/players')).toBeNull();
  });

  it('registers every planned native analytical destination', () => {
    const paths = new Set(MOBILE_ROUTE_DEFINITIONS.map((route) => route.href));
    const plannedSections = [
      '/dashboard/season',
      '/standings/progression',
      '/market/transfers',
      '/players/insights',
      '/player/[id]/performance',
      '/schedule/map',
      '/lineup/analysis',
      '/matches/round/[roundId]',
      '/rounds/[roundId]/comparison',
      '/tournaments/[id]/bracket',
      '/predictions/history',
      '/playoffs/predictions/[userId]',
      '/compare/[userId]',
      '/assistant/[conversationId]',
      '/user/[id]/contributors',
      '/team/[id]/roster',
      '/settings/appearance',
      '/season-review/configurations',
    ];

    plannedSections.forEach((path) => expect(paths.has(path), path).toBe(true));
  });

  it('gives every mobile-only subpage a deterministic desktop destination', () => {
    const subpages = MOBILE_ROUTE_DEFINITIONS.filter((route) => route.parentHref);

    subpages.forEach((route) => {
      const examplePath = route.href.replace(/\[[^\]]+\]/g, '42');
      expect(getDesktopDestination(examplePath), route.href).toBeTruthy();
    });
  });
});
