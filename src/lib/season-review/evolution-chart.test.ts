import { describe, expect, it } from 'vitest';
import { buildEvolutionChartModel, buildEvolutionMilestones } from './evolution-chart';
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

  it('uses the same user filter for milestones and keeps each user real resources', () => {
    const expandedTimeline: HistoricalTimelinePoint[] = [
      timeline[0],
      {
        ...timeline[0],
        day: '2026-01-15',
        users: timeline[0].users.map((user) => ({
          ...user,
          cash: user.cash + 2_000_000,
          totalResources: user.totalResources + 2_000_000,
        })),
      },
      {
        ...timeline[0],
        day: '2026-05-01',
        users: timeline[0].users.map((user) => ({
          ...user,
          cash: user.cash + 4_000_000,
          totalResources: user.totalResources + 4_000_000,
        })),
      },
    ];

    const allUsers = buildEvolutionMilestones(expandedTimeline, '2026-01-20');

    expect(allUsers.map((milestone) => milestone.day)).toEqual([
      '2025-09-01',
      '2026-01-15',
      '2026-05-01',
    ]);
    expect(allUsers[0].users).toHaveLength(3);
    expect(allUsers[0].users[0]).toMatchObject({
      name: 'All Stars',
      cash: 10_000_000,
      squadValue: 30_000_000,
      totalResources: 40_000_000,
    });

    const comparison = buildEvolutionMilestones(expandedTimeline, '2026-01-20', ['3', '1']);

    expect(comparison.every((milestone) => milestone.users.length === 2)).toBe(true);
    expect(comparison[0].users.map((user) => user.name)).toEqual(['All Stars', 'Tercero']);
  });
});
