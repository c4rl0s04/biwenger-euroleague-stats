import { describe, expect, it } from 'vitest';

import { MOBILE_PRIMARY_ITEMS, NAV_ITEMS, isNavigationItemActive } from './navigation';

describe('shell navigation model', () => {
  it('defines 16 canonical navigation items in order', () => {
    expect(NAV_ITEMS).toHaveLength(16);
    expect(NAV_ITEMS[0].href).toBe('/');
    expect(NAV_ITEMS[1].href).toBe('/dashboard');
    expect(NAV_ITEMS[3].href).toBe('/standings');
  });

  it('keeps the four mobile primary link destinations in order', () => {
    expect(MOBILE_PRIMARY_ITEMS.map((item) => item.href)).toEqual([
      '/',
      '/schedule',
      '/dashboard',
      '/standings',
    ]);
  });

  it('identifies exact root route', () => {
    expect(isNavigationItemActive('/', '/')).toBe(true);
    expect(isNavigationItemActive('/dashboard', '/')).toBe(false);
  });

  it('keeps a primary destination active throughout its subpages', () => {
    expect(isNavigationItemActive('/dashboard/season', '/dashboard')).toBe(true);
    expect(isNavigationItemActive('/standings/progression', '/standings')).toBe(true);
    expect(isNavigationItemActive('/schedule/map', '/schedule')).toBe(true);
    expect(isNavigationItemActive('/market/bids', '/dashboard')).toBe(false);
  });

  it('maps player detail pages back to the players destination', () => {
    expect(isNavigationItemActive('/player/42/performance', '/players')).toBe(true);
    expect(isNavigationItemActive('/player/42', '/players')).toBe(true);
    expect(isNavigationItemActive('/players', '/players')).toBe(true);
    expect(isNavigationItemActive('/matches', '/players')).toBe(false);
  });
});
