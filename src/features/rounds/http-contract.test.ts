import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));
const reads = vi.hoisted(() => ({
  getAllRounds: vi.fn(),
  hasOfficialStats: vi.fn(),
  getOfficialStandings: vi.fn(),
  getLivingStandings: vi.fn(),
  getCoachRating: vi.fn(),
  getRoundGlobalStats: vi.fn(),
  getIdealLineup: vi.fn(),
  getUserLineup: vi.fn(),
  getPlayersLeftOut: vi.fn(),
  getUserOptimization: vi.fn(),
  getUserRoundsHistoryDAO: vi.fn(),
  getLineupUsageStats: vi.fn(),
}));
vi.mock('./server/queries/round-analysis.query', () => reads);
const directory = vi.hoisted(() => vi.fn());
vi.mock('./server/queries/directory.query', () => ({
  readManagerDirectory: directory,
}));
vi.mock('./server/services/calendar.service', () => ({
  getRoundCalendar: vi.fn(),
  getLastCompletedRoundId: vi.fn(),
  getLastCompletedCalendarRound: async () => null,
  resolveRoundIdByPolicy: async () => 2,
}));
import { GET as list } from '@/app/api/rounds/list/route';
import { GET as stats } from '@/app/api/rounds/stats/route';
import { GET as standings } from '@/app/api/rounds/standings/route';
import { GET as lineup } from '@/app/api/rounds/lineup/route';
import { GET as history } from '@/app/api/rounds/history/route';
import { GET as allHistory } from '@/app/api/rounds/all-history/route';
import { GET as leaderboard } from '@/app/api/rounds/leaderboard/route';
import { GET as lineupStats } from '@/app/api/rounds/lineup-stats/route';
import {
  standing,
  globalStats,
  lineup as lineupData,
  ideal,
  coach,
  historyRow,
} from './server/services/round-read.fixtures';
const request = (query = '') => new NextRequest(`http://localhost/api/rounds/fixture${query}`);
const privateHeader = 'private, no-store, max-age=0, must-revalidate';
beforeEach(() => {
  vi.clearAllMocks();
  directory.mockResolvedValue([
    { id: '7', name: 'Fixture', icon: null, color_index: 0, secret: 'excluded-fixture' },
  ]);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  reads.getAllRounds.mockResolvedValue([
    { round_id: 2, round_name: null, secret: 'excluded-fixture' },
  ]);
  reads.hasOfficialStats.mockResolvedValue(true);
  reads.getOfficialStandings.mockResolvedValue([{ ...standing, secret: 'excluded-fixture' }]);
  reads.getLivingStandings.mockResolvedValue([standing]);
  reads.getCoachRating.mockResolvedValue({ ...coach, secret: 'excluded-fixture' });
  reads.getRoundGlobalStats.mockResolvedValue({ ...globalStats, secret: 'excluded-fixture' });
  reads.getIdealLineup.mockResolvedValue({ ...ideal, secret: 'excluded-fixture' });
  reads.getUserLineup.mockResolvedValue({ ...lineupData, secret: 'excluded-fixture' });
  reads.getPlayersLeftOut.mockResolvedValue([]);
  reads.getUserOptimization.mockResolvedValue(null);
  reads.getUserRoundsHistoryDAO.mockResolvedValue([{ ...historyRow, secret: 'excluded-fixture' }]);
  reads.getLineupUsageStats.mockResolvedValue({ global: [], byUser: [] });
});
describe('Rounds real HTTP -> service -> mapper contracts', () => {
  it.each([
    ['list', () => list(), 900],
    ['stats', () => stats(request('?roundId=2')), 300],
    ['standings', () => standings(request('?roundId=2')), 60],
    ['lineup', () => lineup(request('?roundId=2&userId=7')), 300],
    ['history', () => history(request('?userId=7')), 0],
    ['all-history', () => allHistory(), 300],
    ['leaderboard', () => leaderboard(), 300],
  ] as const)(
    '%s preserves public URL-keyed envelope/cache and excludes extra fields',
    async (_name, run, seconds) => {
      const response = await run();
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        `public, max-age=${seconds}, stale-while-revalidate=60`
      );
      const text = await response.text();
      expect(JSON.parse(text)).toMatchObject({ success: true });
      expect(text).not.toContain('excluded-fixture');
    }
  );
  it('lineup-stats keeps its distinct missing cache header', async () => {
    const response = await lineupStats();
    expect(response.headers.get('Cache-Control')).toBeNull();
    expect(await response.json()).toEqual({ success: true, data: { global: [], users: [] } });
  });
  it.each([
    ['stats missing round', () => stats(request()), 500, 'Missing roundId'],
    ['stats empty round', () => stats(request('?roundId=')), 500, 'Missing roundId'],
    [
      'quick missing manager',
      () => stats(request('?roundId=2&mode=quick')),
      500,
      'Missing userId for quick mode',
    ],
    [
      'quick empty manager',
      () => stats(request('?roundId=2&mode=quick&userId=')),
      500,
      'Missing userId for quick mode',
    ],
    ['standings', () => standings(request()), 400, 'Missing roundId'],
    ['lineup', () => lineup(request('?roundId=2')), 400, 'Missing userId or roundId'],
    ['history', () => history(request()), 400, 'userId is required'],
  ] as const)(
    '%s keeps required-input status and error text',
    async (_name, run, status, message) => {
      const response = await run();
      expect(response.status).toBe(status);
      expect(response.headers.get('Cache-Control')).toBe(privateHeader);
      expect(await response.json()).toEqual({ success: false, error: message });
    }
  );
  it.each(['007abc', '0', '-2', 'undefined', 'null', ' '])(
    'preserves untrimmed/permissive ID %j',
    async (id) => {
      const response = await standings(request(`?roundId=${encodeURIComponent(id)}&roundId=99`));
      expect(response.status).toBe(200);
      expect(reads.hasOfficialStats).toHaveBeenCalledWith(id);
      expect(reads.getCoachRating).toHaveBeenCalledWith('7', id);
    }
  );
  it.each(['quick', 'full', 'unknown', 'QUICK', ''])(
    'preserves stats %j dispatcher and envelope',
    async (mode) => {
      const response = await stats(request(`?roundId=2&userId=7&mode=${mode}`));
      const body = await response.json();
      if (mode === 'quick' || mode === 'full') {
        expect(body.data).toHaveProperty('users');
        expect(body.data.idealLineup).toEqual([]);
        expect(reads.getUserOptimization).not.toHaveBeenCalled();
      } else {
        expect(body.data.idealLineup).toEqual(ideal);
        expect(body.data.user).toMatchObject({ coachRating: coach, leftOut: [] });
        expect(reads.getUserOptimization).toHaveBeenCalledWith('7', '2');
      }
    }
  );
  it('URL IDs remain authoritative even when unrelated cookie is present', async () => {
    const input = new NextRequest('http://localhost/api/rounds/history?userId=007abc', {
      headers: { cookie: 'unrelated=fixture' },
    });
    expect((await history(input)).status).toBe(200);
    expect(reads.getUserRoundsHistoryDAO).toHaveBeenCalledWith('007abc');
  });
  it.each([
    ['list', () => list(), 'getAllRounds', 'Failed to fetch rounds list', privateHeader],
    [
      'stats',
      () => stats(request('?roundId=2&mode=full')),
      'getRoundGlobalStats',
      'Failed to fetch round stats: fixture failure',
      privateHeader,
    ],
    [
      'standings',
      () => standings(request('?roundId=2')),
      'hasOfficialStats',
      'Failed to fetch round standings',
      privateHeader,
    ],
    [
      'lineup',
      () => lineup(request('?roundId=2&userId=7')),
      'getUserLineup',
      'Failed to fetch user lineup',
      privateHeader,
    ],
    [
      'history',
      () => history(request('?userId=7')),
      'getUserRoundsHistoryDAO',
      'Failed to fetch history',
      privateHeader,
    ],
    [
      'lineup-stats',
      () => lineupStats(),
      'getLineupUsageStats',
      'Failed to fetch lineup stats',
      null,
    ],
  ] as const)(
    '%s preserves rejected-read status/error/cache',
    async (_name, run, query, message, cache) => {
      reads[query].mockRejectedValue(new Error('fixture failure'));
      const response = await run();
      expect(response.status).toBe(500);
      expect(response.headers.get('Cache-Control')).toBe(cache);
      expect(await response.json()).toEqual({ success: false, error: message });
    }
  );
  it('retains Unknown error for non-Error stats rejection', async () => {
    reads.getRoundGlobalStats.mockRejectedValue('fixture');
    expect(await (await stats(request('?roundId=2'))).json()).toEqual({
      success: false,
      error: 'Failed to fetch round stats: Unknown error',
    });
  });
  it.each([
    ['all-history', allHistory, 'Error fetching history data'],
    ['leaderboard', leaderboard, 'Error fetching leaderboard data'],
  ] as const)(
    '%s propagates directory failures with existing private error contract',
    async (_name, run, error) => {
      directory.mockRejectedValue(new Error('fixture directory failure'));
      const response = await run();
      expect(response.status).toBe(500);
      expect(response.headers.get('Cache-Control')).toBe(privateHeader);
      expect(await response.json()).toEqual({ success: false, error });
    }
  );
});
