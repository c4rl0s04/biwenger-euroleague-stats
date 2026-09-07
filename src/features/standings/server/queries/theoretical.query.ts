import { getTheoreticalGapStats, getRivalryMatrixStats, getHeatmapStats } from '@/lib/db';
import { getLeagueComparisonStats } from '@/lib/db';

import { getAllUsers } from '@/lib/db';
import { getUserPerformanceHistoryService } from '@/features/rounds/server';

export async function queryTheoreticalGapStats() {
  return getTheoreticalGapStats();
}
export async function queryLeagueComparisonStats() {
  return getLeagueComparisonStats();
}
export async function queryRivalryMatrixStats() {
  return getRivalryMatrixStats();
}
export async function queryHeatmapStats() {
  return getHeatmapStats();
}

export async function queryTheoreticalStandings() {
  const users = await getAllUsers();
  const theoreticalData = await Promise.all(
    users.map(async (user) => {
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
  return theoreticalData.sort((a, b) => b.total_ideal - a.total_ideal);
}
