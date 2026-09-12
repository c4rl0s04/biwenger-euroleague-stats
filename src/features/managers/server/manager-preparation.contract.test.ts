import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn(), form: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ db: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
vi.mock('@/features/players/server', () => ({ getPlayerFormStats: fake.form }));
vi.mock('@/features/managers/server', async () => import('./services/manager-preparation.service'));
import {
  getManagerCaptainRecommendations,
  getManagerPersonalizedAlerts,
} from './services/manager-preparation.service';
import { getCaptainRecommendations, getPersonalizedAlerts } from '@/lib/db/queries/core/users';
import { mapCaptainRecommendations } from './mappers/manager-preparation.mapper';

const hash = (sql: string) =>
  createHash('sha256').update(sql.replace(/\s+/g, ' ').trim()).digest('hex');
beforeEach(() => {
  vi.clearAllMocks();
  fake.season.mockResolvedValue('fixture-season');
  fake.query.mockResolvedValue({ rows: [] });
  fake.form.mockResolvedValue([]);
});

describe('manager preparation read contracts', () => {
  it('uses the original candidate SQL and three-game form contract without coercing owner ID', async () => {
    fake.query.mockResolvedValue({
      rows: [
        {
          player_id: 7,
          name: null,
          position: null,
          team_id: null,
          team: null,
          password: 'synthetic-canary',
        },
      ],
    });
    fake.form.mockResolvedValue([
      { playerId: 7, recentScores: '30,X,30', averageRecentPoints: 30, formScore: 20 },
    ]);
    expect(await getManagerCaptainRecommendations('007')).toEqual([
      {
        player_id: 7,
        name: null,
        position: null,
        team_id: null,
        team: null,
        avg_recent_points: 20,
        recent_games: 2,
        recent_scores: '30,X,30',
        form_label: 'Buena forma',
      },
    ]);
    expect(fake.query.mock.calls[0][1]).toEqual(['fixture-season', '007']);
    expect(hash(fake.query.mock.calls[0][0])).toBe(
      'f5479389182e2faf4094cf7985ddfc3e88061f28ccad86029602b00283b3f3e3'
    );
    expect(fake.form).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('preserves form thresholds, stable ties, positive filtering and native slice behavior', () => {
    const rows = [1, 2, 3, 4, 5, 6].map((player_id) => ({
      player_id,
      name: 'Fixture',
      position: 'G',
      team_id: 1,
      team: 'Fixture',
    }));
    const forms = [25, 25, 18, 12, 11, 0].map((formScore, i) => ({
      playerId: i + 1,
      recentScores: '0,X,1',
      averageRecentPoints: 999,
      formScore,
    }));
    const all = mapCaptainRecommendations(rows, forms, 99);
    expect(all.map((row) => row.player_id)).toEqual([1, 2, 3, 4, 5]);
    expect(all.map((row) => row.form_label)).toEqual([
      'Excelente forma',
      'Excelente forma',
      'Buena forma',
      'Forma regular',
      'Forma baja',
    ]);
    expect(mapCaptainRecommendations(rows, forms, 0)).toEqual([]);
    expect(mapCaptainRecommendations(rows, forms, -1)).toEqual(all.slice(0, -1));
  });

  it('resolves the owner season before starting both candidate and form reads', async () => {
    let resolveSeason!: (value: string) => void;
    fake.season.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveSeason = resolve;
      })
    );
    const result = getCaptainRecommendations('007');
    expect(fake.query).not.toHaveBeenCalled();
    expect(fake.form).not.toHaveBeenCalled();
    resolveSeason('fixture-season');
    expect(await result).toEqual([]);
    expect(fake.query).toHaveBeenCalledTimes(1);
    expect(fake.form).toHaveBeenCalledTimes(1);
  });

  it('preserves alert SQL order, formatting, severity and default limit', async () => {
    fake.query
      .mockResolvedValueOnce({ rows: [{ name: 'A', price_increment: '750000' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'B', price_increment: '-1250000' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'C', fantasy_points: '25.5' }] });
    expect(await getManagerPersonalizedAlerts('007')).toEqual([
      {
        type: 'price_gain',
        icon: '📈',
        message: 'Tu jugador A ha ganado 0.75M€',
        severity: 'success',
      },
      {
        type: 'price_loss',
        icon: '📉',
        message: 'Tu jugador B ha perdido 1.25M€',
        severity: 'warning',
      },
      {
        type: 'good_performance',
        icon: '⭐',
        message: '¡C brilló con 25.5 puntos!',
        severity: 'info',
      },
    ]);
    expect(fake.query.mock.calls.map(([sql]) => hash(sql))).toEqual([
      'd829213ef974074f4bcf3d9fdbcc5edeb6f9e3b37aa0c550072630e42e884fd9',
      '4fab997ec4e85e2992c60c11c22373099149a0eeb087e1a84e34457d8e8999c8',
      '685fc3948084b74168ddc43eb604e134a27fd2ed18b29026bf566353b90ea0cf',
    ]);
    expect(fake.query.mock.calls.map(([, args]) => args)).toEqual(
      Array(3).fill(['fixture-season', '007'])
    );
    expect(await getPersonalizedAlerts('007', 0)).toEqual([]);
    expect(fake.query).toHaveBeenCalledTimes(6);
  });

  it('does not memoize and propagates season/query/form errors', async () => {
    expect(await getCaptainRecommendations(7)).toEqual([]);
    expect(await getCaptainRecommendations(7)).toEqual([]);
    expect(fake.form).toHaveBeenCalledTimes(2);
    const failure = new Error('synthetic-failure');
    fake.form.mockRejectedValue(failure);
    await expect(getManagerCaptainRecommendations(7)).rejects.toBe(failure);
    fake.query.mockRejectedValue(failure);
    await expect(getManagerPersonalizedAlerts(7)).rejects.toBe(failure);
    fake.season.mockRejectedValue(failure);
    await expect(getManagerCaptainRecommendations(7)).rejects.toBe(failure);
  });
});
