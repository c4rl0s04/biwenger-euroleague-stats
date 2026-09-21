import { describe, expect, it } from 'vitest';
import {
  mapDashboardCalendarRound,
  mapDashboardIdealLineup,
  mapDashboardRecords,
} from './dashboard.mapper';
import { toMobileDashboardViewModel } from '../../mappers/mobile-dashboard.mapper';
import type { LastRoundStats } from '@/features/rounds/public';

describe('Dashboard projections', () => {
  it('keeps the five-player/three-per-position greedy order, null arithmetic and first round name without mutating input', () => {
    const players: LastRoundStats[] = ['B', 'B', 'B', 'B', 'A', 'P', 'A'].map(
      (position, index) => ({
        player_id: index + 1,
        name: 'Player',
        team: null,
        position,
        price: null,
        points: index === 0 ? null : 10 - index,
        owner_name: null,
        round_name: 'J1',
      })
    );
    const before = structuredClone(players);
    const result = mapDashboardIdealLineup(players);
    expect(result.lineup.map((p) => p.player_id)).toEqual([1, 2, 3, 5, 6]);
    expect(result.total_points).toBe(28);
    expect(result.round_name).toBe('J1');
    expect(result.lineup[0].img).toBe('https://cdn.biwenger.com/players/euroleague/1.png');
    expect(players).toEqual(before);
    expect(mapDashboardIdealLineup([])).toEqual({ lineup: [], total_points: 0, round_name: '-' });
  });
  it('preserves record ordering, labels, nulls and numeric-string values', () => {
    const records = mapDashboardRecords(
      { user_name: 'Manager', round_name: 'J1', points: 99 },
      { player_name: 'Player', precio: '1500000', comprador: null },
      { name: 'Riser', price_increment: '300000' }
    );
    expect(records).toEqual([
      {
        type: 'highest_round',
        label: 'Récord de puntos en jornada',
        description: 'Manager - 99 pts en J1',
        user_name: 'Manager',
        value: 99,
      },
      {
        type: 'highest_transfer',
        label: 'Fichaje más caro',
        description: 'Player - 1.50M€ (null)',
        user_name: null,
        value: '1500000',
      },
      {
        type: 'biggest_gain',
        label: 'Mayor revalorización',
        description: 'Riser +0.30M€',
        player_name: 'Riser',
        value: '300000',
      },
    ]);
    expect(mapDashboardRecords(null, null, { name: 'No gain', price_increment: 0 })).toEqual([]);
    expect(JSON.parse(JSON.stringify(records))).toEqual(records);
  });
  it('allowlists the calendar and keeps JSON date values', () => {
    const round = {
      roundId: 1,
      roundName: null,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: null,
      totalMatches: 1,
      finishedMatches: 0,
      status: 'upcoming' as const,
      matches: [
        { id: 3, date: null, status: null, roundId: 1, roundName: null, secret: 'excluded' },
      ],
      secret: 'excluded',
    };
    const result = mapDashboardCalendarRound(round);
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(result?.start_date).toBe(round.startDate);
    expect(mapDashboardCalendarRound(null)).toBeNull();
  });
  it('retains phone field precedence, limits and finite-number fallback', () => {
    const result = toMobileDashboardViewModel({
      userDashboard: {
        seasonStats: { name: '', total_points: Infinity },
        alerts: [
          { title: '', message: 'ignored', severity: '', type: 'ignored' },
          { message: 'second' },
          {},
          { title: 'fourth' },
        ],
      },
      leagueDashboard: {
        hotStreaks: [{ name: '', player_name: 'ignored' }, { player_name: 'Fallback' }],
      },
      nextRoundData: { nextRound: { round_id: 0, id: 9, round_name: '', name: 'ignored' } },
      news: [{ title: '', text: 'ignored', description: '', message: 'ignored' }],
    });
    expect(result.managerName).toBe('Tu equipo');
    expect(result.points).toBe(0);
    expect(result.alerts).toEqual([
      { id: '0', title: '', severity: '' },
      { id: '1', title: 'second', severity: 'info' },
      { id: '2', title: 'Aviso de tu equipo', severity: 'info' },
    ]);
    expect(result.formPlayers).toEqual(['Fallback']);
    expect(result.nextRound).toEqual({ id: '0', name: '' });
    expect(result.news).toEqual([{ id: '0', title: '', description: '' }]);
  });
});
