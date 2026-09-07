import fs from 'fs';

let content = fs.readFileSync('src/features/standings/server/queries/theoretical.query.ts', 'utf8');

// The new theoretical.query.ts will just use the internal queries from advanced.query and performance.query
let newQuery = `import 'server-only';
import { getTheoreticalGapStats, getRivalryMatrixStats, getHeatmapStats } from './advanced.query';
import { getLeagueComparisonStats } from './performance.query';

export async function queryTheoreticalGapStats() { return getTheoreticalGapStats(); }
export async function queryLeagueComparisonStats() { return getLeagueComparisonStats(); }
export async function queryRivalryMatrixStats() { return getRivalryMatrixStats(); }
export async function queryHeatmapStats() { return getHeatmapStats(); }
`;

fs.writeFileSync('src/features/standings/server/queries/theoretical.query.ts', newQuery);

// Then theoretical.service.ts will do the logic
let newService = `import 'server-only';
import { cache } from 'react';
import {
  mapTheoreticalGapStat,
  mapLeagueComparisonStat,
  mapRivalryMatrixStat,
  mapHeatmapStat,
  mapTheoreticalStandingsStat,
} from '../mappers/theoretical.mapper';
import {
  queryTheoreticalGapStats,
  queryLeagueComparisonStats,
  queryRivalryMatrixStats,
  queryHeatmapStats,
} from '../queries/theoretical.query';
import { getExtendedStandings } from '../queries/base.query';
import { getUserPerformanceHistoryService } from '@/features/rounds/server';

export const fetchTheoreticalGapStats = cache(async () => {
  return (await queryTheoreticalGapStats()).map(mapTheoreticalGapStat);
});
export const fetchLeagueComparisonStats = cache(async () => {
  return (await queryLeagueComparisonStats()).map(mapLeagueComparisonStat);
});
export const fetchRivalryMatrixStats = cache(async () => {
  return mapRivalryMatrixStat(await queryRivalryMatrixStats());
});
export const fetchHeatmapStats = cache(async () => {
  return mapHeatmapStat(await queryHeatmapStats());
});
export const fetchTheoreticalStandings = cache(async () => {
  const standings = await getExtendedStandings();
  const theoreticalData = await Promise.all(
    standings.map(async (user) => {
      const history = await getUserPerformanceHistoryService(user.user_id);
      const totalActual = history.reduce((sum, r) => sum + r.actual_points, 0);
      const totalIdeal = history.reduce((sum, r) => sum + (r.ideal_points || 0), 0);
      const roundsPlayed = history.length;
      return {
        user_id: user.user_id,
        name: user.name,
        icon: user.icon,
        color_index: user.color_index,
        total_actual: totalActual,
        total_ideal: totalIdeal,
        gap: totalIdeal - totalActual,
        efficiency: totalIdeal > 0 ? (totalActual / totalIdeal) * 100 : 0,
        rounds_played: roundsPlayed,
      };
    })
  );
  return theoreticalData
    .sort((a, b) => b.total_ideal - a.total_ideal)
    .map(mapTheoreticalStandingsStat);
});
`;

fs.writeFileSync('src/features/standings/server/services/theoretical.service.ts', newService);

