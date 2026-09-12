import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ db: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
vi.mock('@/features/managers/server', async () => import('./services/manager-performance.service'));
import {
  getManagerCaptainStats,
  getManagerHomeAwayStats,
} from './services/manager-performance.service';
import { getUserCaptainStats, getUserHomeAwayStats } from '@/lib/db/queries/core/users';

const hash = (sql: string) =>
  createHash('sha256').update(sql.replace(/\s+/g, ' ').trim()).digest('hex');
// Exact normalized SQL captured from 67e8831c, before extraction.
const captainSQL = [
  'ddee41cd17a7b6b26bb35a8d6291316ec045404e341b2ab193f3b43c6fea46af',
  '401b3b5ecd70108760c559be19435cee88134a5f1fe24d9b10ef6d3aa0c1377d',
  '61906702bfd6c665cd25b325d84b956926e2d1c3460eb362b230b30cfbd5fb04',
  '40046c6a10e67ec90ac617f39526be9f3ad7715717e356e0a184f4b6d8fd15d2',
];
beforeEach(() => {
  vi.clearAllMocks();
  fake.season.mockResolvedValue('fixture-season');
  fake.query.mockResolvedValue({ rows: [] });
});

describe('manager performance compatibility', () => {
  it('preserves SQL, parameter order, text identity and nested allowlisting', async () => {
    fake.query
      .mockResolvedValueOnce({
        rows: [{ total_rounds: '3', extra_points: '12', avg_points: '4.25' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            player_id: 4,
            name: null,
            times_captain: '2',
            avg_as_captain: '6.5',
            total_as_captain: '13',
            credential: 'synthetic-canary',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ name: 'Best', points: '12.9' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Worst', points: '-3' }] });
    expect(await getManagerCaptainStats('007')).toEqual({
      total_rounds: 3,
      extra_points: 12,
      avg_points: 4.25,
      most_used: [
        { player_id: 4, name: null, times_captain: 2, avg_as_captain: 6.5, total_as_captain: 13 },
      ],
      best_round: { name: 'Best', points: 12 },
      worst_round: { name: 'Worst', points: -3 },
    });
    expect(fake.query.mock.calls.map(([sql]) => hash(sql))).toEqual(captainSQL);
    expect(fake.query.mock.calls.map(([, args]) => args)).toEqual(
      Array(4).fill(['007', 'fixture-season'])
    );
    expect(fake.season).toHaveBeenCalledTimes(1);
  });

  it('retains the distinction between missing captain aggregates and SQL null aggregates', async () => {
    const empty = await getManagerCaptainStats(7);
    expect(empty).toEqual({
      total_rounds: 0,
      extra_points: 0,
      avg_points: 0,
      most_used: [],
      best_round: { name: '', points: 0 },
      worst_round: { name: '', points: 0 },
    });
    fake.query.mockResolvedValueOnce({
      rows: [{ total_rounds: '0', extra_points: null, avg_points: null }],
    });
    const result = await getUserCaptainStats(7);
    expect(result.extra_points).toBeNaN();
    expect(result.avg_points).toBeNaN();
    expect(JSON.parse(JSON.stringify(result))).toEqual({
      ...empty,
      extra_points: null,
      avg_points: null,
    });
    expect(fake.season).toHaveBeenCalledTimes(2);
  });

  it.each([0, 1, 2, 3])(
    'stops at captain query failure %i without starting later reads',
    async (index) => {
      const failure = new Error('synthetic-query-failure');
      for (let i = 0; i < index; i++) fake.query.mockResolvedValueOnce({ rows: [] });
      fake.query.mockRejectedValueOnce(failure);
      await expect(getManagerCaptainStats('007')).rejects.toBe(failure);
      expect(fake.query).toHaveBeenCalledTimes(index + 1);
    }
  );

  it('preserves home/away SQL, rounding and legacy adapter output', async () => {
    fake.query.mockResolvedValue({
      rows: [{ total_home: '10', total_away: '6', games_home: '3', games_away: '2' }],
    });
    const expected = {
      total_home: 10,
      total_away: 6,
      avg_home: 3,
      avg_away: 3,
      difference_pct: 67,
    };
    expect(await getManagerHomeAwayStats('007')).toEqual(expected);
    expect(await getUserHomeAwayStats('007')).toEqual(expected);
    expect(hash(fake.query.mock.calls[0][0])).toBe(
      'fd8863207e9d5e7945faffd584d01eb350e5fecac0ab8ecdb3d2e907c1d21780'
    );
    expect(fake.query.mock.calls.map(([, args]) => args)).toEqual(
      Array(2).fill(['fixture-season', '007'])
    );
  });

  it('retains home/away null fallbacks and missing-row failure', async () => {
    fake.query.mockResolvedValueOnce({
      rows: [{ total_home: null, total_away: null, games_home: null, games_away: null }],
    });
    expect(await getManagerHomeAwayStats(7)).toEqual({
      total_home: 0,
      total_away: 0,
      avg_home: 0,
      avg_away: 0,
      difference_pct: 0,
    });
    await expect(getManagerHomeAwayStats(7)).rejects.toBeInstanceOf(TypeError);
  });

  it('does not access persistence after season resolution fails', async () => {
    const failure = new Error('synthetic-season-failure');
    fake.season.mockRejectedValue(failure);
    await expect(getManagerCaptainStats(7)).rejects.toBe(failure);
    await expect(getManagerHomeAwayStats(7)).rejects.toBe(failure);
    expect(fake.query).not.toHaveBeenCalled();
  });
});
