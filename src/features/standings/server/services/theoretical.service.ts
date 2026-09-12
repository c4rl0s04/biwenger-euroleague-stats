import 'server-only';

/** Access: public league statistics, no session identity. Freshness: no service cache;
 * existing query caches and each HTTP adapter's headers remain authoritative.
 * Heatmap/rivalry retain season-scoped 900-second query caches; other reads are uncached.
 */
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
import { queryStandingsManagers } from '../queries/manager-directory.query';
import { getUserPerformanceHistoryService } from '@/features/rounds/server';

export const fetchTheoreticalGapStats = async () => {
  return (await queryTheoreticalGapStats()).map(mapTheoreticalGapStat);
};
export const fetchLeagueComparisonStats = async () => {
  return (await queryLeagueComparisonStats()).map(mapLeagueComparisonStat);
};
export const fetchRivalryMatrixStats = async () => {
  return mapRivalryMatrixStat(await queryRivalryMatrixStats());
};
export const fetchHeatmapStats = async () => {
  return mapHeatmapStat(await queryHeatmapStats());
};
export const fetchTheoreticalStandings = async () => {
  const standings = await queryStandingsManagers();
  const theoreticalData = await Promise.all(
    standings.map(async (user) => {
      const history = await getUserPerformanceHistoryService(user.id);
      const totalActual = history.reduce((sum, r) => sum + r.actual_points, 0);
      const totalIdeal = history.reduce((sum, r) => sum + (r.ideal_points || 0), 0);
      const roundsPlayed = history.length;
      return {
        user_id: user.id,
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
};
