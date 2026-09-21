import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));
const reads = vi.hoisted(() => ({
  fetchPlayerBirthdays: vi.fn(),
  fetchRisingStars: vi.fn(),
  fetchTopPlayers: vi.fn(),
  fetchTopPlayersByForm: vi.fn(),
  fetchMarketOpportunities: vi.fn(),
  fetchLastRoundMVPs: vi.fn(),
  fetchNextRound: vi.fn(),
  fetchLeagueAveragePoints: vi.fn(),
  getDashboardIdealLineup: vi.fn(),
  getRecentActivityData: vi.fn(),
}));
vi.mock('@/features/dashboard/server', async () => ({
  ...reads,
  ...(await import('@/features/dashboard/validation/activity-input')),
}));
import { GET as birthdays } from '../birthdays/route';
import { GET as rising } from '../rising-stars/route';
import { GET as top } from '../top-players/route';
import { GET as form } from '../top-form/route';
import { GET as market } from '../market-opportunities/route';
import { GET as mvps } from '../mvps/route';
import { GET as next } from '../next-round/route';
import { GET as average } from '../../league-average/route';
import { GET as ideal } from '../ideal-lineup/route';
import { GET as activity } from '../recent-activity/route';

const privateCache = 'private, no-store, max-age=0, must-revalidate';
const publicCache = (seconds: number) => `public, max-age=${seconds}, stale-while-revalidate=60`;
beforeEach(() => {
  Object.values(reads).forEach((read) => read.mockReset());
});

describe.each([
  {
    name: 'birthdays',
    get: birthdays,
    read: reads.fetchPlayerBirthdays,
    seconds: 300,
    args: [],
    error: 'Failed to fetch birthdays',
  },
  {
    name: 'rising-stars',
    get: rising,
    read: reads.fetchRisingStars,
    seconds: 300,
    args: [],
    error: 'Failed to fetch rising stars',
  },
  {
    name: 'top-players',
    get: top,
    read: reads.fetchTopPlayers,
    seconds: 300,
    args: [],
    error: 'Failed to fetch top players',
  },
  {
    name: 'top-form',
    get: form,
    read: reads.fetchTopPlayersByForm,
    seconds: 60,
    args: [6, 3],
    error: 'Failed to fetch top form data',
  },
  {
    name: 'market-opportunities',
    get: market,
    read: reads.fetchMarketOpportunities,
    seconds: 60,
    args: [6],
    error: 'Failed to fetch market opportunities',
  },
  {
    name: 'mvps',
    get: mvps,
    read: reads.fetchLastRoundMVPs,
    seconds: 300,
    args: [],
    error: 'Failed to fetch MVPs',
  },
])('$name contract', ({ get, read, seconds, args, error }) => {
  it.each([{ data: [] }, { data: [{ player_id: 7, owner_name: null, points: 0 }] }])(
    'retains envelope, fields, cache and service arguments',
    async ({ data }) => {
      read.mockResolvedValue(data);
      const response = await get();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, data });
      expect(response.headers.get('cache-control')).toBe(publicCache(seconds));
      expect(read).toHaveBeenCalledWith(...args);
    }
  );
  it('retains generic private errors', async () => {
    read.mockRejectedValue(new Error('synthetic internal detail'));
    const response = await get();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error });
    expect(response.headers.get('cache-control')).toBe(privateCache);
  });
});
it.each([null, { round_id: 1, start_date: null, matches: [] }])(
  'keeps next-round nesting, nullable payload and short cache',
  async (data) => {
    reads.fetchNextRound.mockResolvedValue(data);
    const response = await next();
    expect(await response.json()).toEqual({ success: true, data: { nextRound: data } });
    expect(response.headers.get('cache-control')).toBe(publicCache(60));
  }
);
it.each([null, 0, 73.2])(
  'keeps nullable league average %s instead of coercing it',
  async (value) => {
    reads.fetchLeagueAveragePoints.mockResolvedValue(value);
    const response = await average();
    expect(await response.json()).toEqual({ success: true, data: { average: value } });
    expect(response.headers.get('cache-control')).toBe(publicCache(300));
  }
);
it.each([60, 300])(
  'uses the ideal-lineup service response and its %s-second policy',
  async (cacheSeconds) => {
    const data = { lineup: [], total_points: 0, round_name: '-' };
    reads.getDashboardIdealLineup.mockResolvedValue({ data, cacheSeconds });
    const response = await ideal();
    expect(await response.json()).toEqual({ success: true, data });
    expect(response.headers.get('cache-control')).toBe(publicCache(cacheSeconds));
  }
);
it.each([
  { get: next, read: reads.fetchNextRound, error: 'Failed to fetch next round data' },
  { get: average, read: reads.fetchLeagueAveragePoints, error: 'Internal Server Error' },
  { get: ideal, read: reads.getDashboardIdealLineup, error: 'Failed to fetch ideal lineup' },
])('preserves $error failure', async ({ get, read, error }) => {
  read.mockRejectedValue(new Error('synthetic internal detail'));
  const response = await get();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ success: false, error });
  expect(response.headers.get('cache-control')).toBe(privateCache);
});

describe('recent-activity URL identity (no session fallback)', () => {
  it.each([
    ['', null],
    ['?userId=', null],
    ['?userId=007', '7'],
    ['?userId=7abc', '7'],
    ['?userId=7.9', '7'],
    ['?userId=1e2', '1'],
    ['?userId=7&userId=8', '7'],
    ['?userId=&userId=8', null],
    ['?userId=999999999', '999999999'],
  ])('preserves parsing for %s', async (query, id) => {
    const data = {
      recentTransfers: [],
      priceChanges: [],
      recentRecords: [],
      personalizedAlerts: [],
    };
    reads.getRecentActivityData.mockResolvedValue(data);
    const response = await activity(
      new NextRequest('http://localhost/api/dashboard/recent-activity' + query, {
        headers: { cookie: 'synthetic-session=other-manager' },
      })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data });
    expect(reads.getRecentActivityData).toHaveBeenCalledWith(id);
    expect(response.headers.get('cache-control')).toBe(
      id === null ? publicCache(60) : privateCache
    );
  });
  it.each(['0', '-1', '1000000000', 'null', 'undefined', 'abc', ' '])(
    'rejects %s without reading',
    async (id) => {
      const response = await activity(
        new NextRequest(
          'http://localhost/api/dashboard/recent-activity?userId=' + encodeURIComponent(id)
        )
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ success: false, error: 'Invalid user ID format' });
      expect(response.headers.get('cache-control')).toBe(privateCache);
      expect(reads.getRecentActivityData).not.toHaveBeenCalled();
    }
  );
  it('keeps read errors private', async () => {
    reads.getRecentActivityData.mockRejectedValue(new Error('synthetic internal detail'));
    const response = await activity(
      new NextRequest('http://localhost/api/dashboard/recent-activity?userId=7')
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Failed to fetch recent activity',
    });
    expect(response.headers.get('cache-control')).toBe(privateCache);
  });
});
