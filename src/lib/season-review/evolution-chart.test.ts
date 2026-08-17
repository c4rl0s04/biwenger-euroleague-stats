import { describe, expect, it } from 'vitest';
import { buildEvolutionChartModel } from './evolution-chart';
import type { HistoricalTimelinePoint } from './types';

const timeline: HistoricalTimelinePoint[] = [
  {
    day: '2025-09-01',
    resourceGini: 0,
    squadGini: 0,
    absoluteResourceGap: 0,
    absoluteSquadGap: 0,
    users: [
      {
        userId: '1',
        name: 'All Stars',
        color: '#fa5001',
        cash: 10_000_000,
        squadValue: 30_000_000,
        totalResources: 40_000_000,
        rosterSize: 13,
        cumulativeBonuses: 0,
        cumulativePoints: 0,
      },
      {
        userId: '2',
        name: 'Nonameyet',
        color: '#38bdf8',
        cash: 12_000_000,
        squadValue: 28_000_000,
        totalResources: 40_000_000,
        rosterSize: 13,
        cumulativeBonuses: 0,
        cumulativePoints: 0,
      },
      {
        userId: '3',
        name: 'Tercero',
        color: '#22c55e',
        cash: 8_000_000,
        squadValue: 32_000_000,
        totalResources: 40_000_000,
        rosterSize: 13,
        cumulativeBonuses: 0,
        cumulativePoints: 0,
      },
    ],
  },
];

describe('evolution chart model', () => {
  it('shows every user by default and only the chosen pair when comparing', () => {
    const allUsers = buildEvolutionChartModel(timeline, 'squadValue');

    expect(allUsers.series.map((series) => series.name)).toEqual([
      'All Stars',
      'Nonameyet',
      'Tercero',
    ]);
    expect(allUsers.data[0]).toMatchObject({ user_0: 30, user_1: 28, user_2: 32 });

    const comparison = buildEvolutionChartModel(timeline, 'squadValue', ['3', '1']);

    expect(comparison.series.map((series) => series.name)).toEqual(['All Stars', 'Tercero']);
    expect(comparison.data[0]).toMatchObject({ user_0: 30, user_2: 32 });
    expect(comparison.data[0]).not.toHaveProperty('user_1');
  });
});
