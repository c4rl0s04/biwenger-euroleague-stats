import { describe, expect, it } from 'vitest';

import { toMobileDashboardViewModel } from './dashboard';

describe('toMobileDashboardViewModel', () => {
  it('keeps only the compact, serializable summary required by the phone screen', () => {
    const result = toMobileDashboardViewModel({
      userDashboard: {
        seasonStats: {
          name: 'All Stars',
          position: 2,
          total_points: 1234,
          average_points: 88.1,
          victories: 4,
        },
        squadDetails: { total_value: 71_500_000, player_count: 15 },
        alerts: [{ id: 8, title: 'Lesión detectada', severity: 'warning' }],
      },
      leagueDashboard: { leagueAverage: 81.4, hotStreaks: [{ name: 'Mike James' }] },
      nextRoundData: { nextRound: { round_id: 9, round_name: 'Jornada 9' } },
      news: [{ id: 'n-1', title: 'Nuevo fichaje', description: 'Movimiento confirmado' }],
    });

    expect(result).toEqual({
      managerName: 'All Stars',
      position: 2,
      points: 1234,
      averagePoints: 88.1,
      victories: 4,
      squadValue: 71_500_000,
      squadSize: 15,
      leagueAverage: 81.4,
      nextRound: { id: '9', name: 'Jornada 9' },
      alerts: [{ id: '8', title: 'Lesión detectada', severity: 'warning' }],
      formPlayers: ['Mike James'],
      news: [{ id: 'n-1', title: 'Nuevo fichaje', description: 'Movimiento confirmado' }],
    });
  });

  it('provides stable fallbacks when optional aggregates are missing', () => {
    expect(
      toMobileDashboardViewModel({
        userDashboard: {},
        leagueDashboard: {},
        nextRoundData: {},
        news: [],
      })
    ).toMatchObject({
      managerName: 'Tu equipo',
      position: 0,
      points: 0,
      nextRound: null,
      alerts: [],
      news: [],
    });
  });
});
