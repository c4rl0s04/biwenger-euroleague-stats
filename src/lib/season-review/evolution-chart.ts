import type { HistoricalTimelinePoint, HistoricalUserPoint } from './types';

export type EvolutionMetric = 'totalResources' | 'squadValue' | 'cash';

export interface EvolutionSeries {
  userId: string;
  key: string;
  name: string;
  color: string;
}

export type EvolutionChartDatum = { day: string } & Record<string, string | number>;

export function buildEvolutionChartModel(
  timeline: HistoricalTimelinePoint[],
  metric: EvolutionMetric,
  selectedUserIds?: string[]
): { series: EvolutionSeries[]; data: EvolutionChartDatum[] } {
  const users = new Map<string, HistoricalUserPoint>();

  for (const point of timeline) {
    for (const user of point.users) {
      if (!users.has(user.userId)) users.set(user.userId, user);
    }
  }

  const selected = selectedUserIds ? new Set(selectedUserIds) : null;
  const series = Array.from(users.values())
    .map((user, index) => ({
      userId: user.userId,
      key: `user_${index}`,
      name: user.name,
      color: user.color,
    }))
    .filter((user) => !selected || selected.has(user.userId));

  const data = timeline.map((point) => {
    const row: EvolutionChartDatum = { day: point.day };
    for (const item of series) {
      const user = point.users.find((candidate) => candidate.userId === item.userId);
      if (user) row[item.key] = user[metric] / 1_000_000;
    }
    return row;
  });

  return { series, data };
}
