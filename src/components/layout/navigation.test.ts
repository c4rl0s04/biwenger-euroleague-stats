import { describe, expect, it } from 'vitest';

import { MOBILE_PRIMARY_ITEMS, isNavigationItemActive } from './navigation';

describe('mobile navigation contract', () => {
  it('keeps the four link destinations in order, with More supplied by the shell as the fifth item', () => {
    expect(MOBILE_PRIMARY_ITEMS.map((item) => item.href)).toEqual([
      '/',
      '/schedule',
      '/dashboard',
      '/standings',
    ]);
  });

  it('keeps a primary destination active throughout its native mobile subpages', () => {
    expect(isNavigationItemActive('/dashboard/season', '/dashboard')).toBe(true);
    expect(isNavigationItemActive('/standings/progression', '/standings')).toBe(true);
    expect(isNavigationItemActive('/schedule/map', '/schedule')).toBe(true);
    expect(isNavigationItemActive('/market/bids', '/dashboard')).toBe(false);
  });

  it('maps player detail pages back to the players destination in More', () => {
    expect(isNavigationItemActive('/player/42/performance', '/players')).toBe(true);
  });
});
