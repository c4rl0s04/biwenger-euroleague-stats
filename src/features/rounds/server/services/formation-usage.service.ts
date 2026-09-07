import 'server-only';
import type { LineupStatsViewModel } from '../../models/round-read';
import { getLineupUsageStats } from '../queries/round-analysis.query';
import { readManagerDirectory } from '../queries/directory.query';

export function createFormationUsageService(deps: {
  usage: typeof getLineupUsageStats;
  managers: typeof readManagerDirectory;
}) {
  async function fetchLineupStats(): Promise<LineupStatsViewModel> {
    const { global, byUser } = await deps.usage();
    const users = await deps.managers();
    const toNumber = (value: number | undefined) => Number(value) || 0;
    const totalGlobalRounds = global.reduce((sum, item) => sum + toNumber(item.count), 0);
    const globalStats = global.map((item) => ({
      formation: item.alineacion,
      count: toNumber(item.count),
      percentage: totalGlobalRounds > 0 ? (toNumber(item.count) / totalGlobalRounds) * 100 : 0,
    }));
    const userStats = users
      .map((user) => {
        // Strict identity and query ordering are deliberately preserved.
        const entries = byUser.filter((row) => row.user_id === user.id);
        const totalRounds = toNumber(entries[0]?.total_count);
        const topFormations = entries.map((entry) => ({
          formation: entry.alineacion,
          count: toNumber(entry.count),
          percentage: totalRounds > 0 ? (toNumber(entry.count) / totalRounds) * 100 : 0,
        }));
        return {
          userId: user.id,
          name: user.name,
          icon: user.icon,
          color_index: user.color_index,
          favorite: topFormations[0] || null,
          topFormations,
          totalRounds,
        };
      })
      .filter((user) => user.favorite !== null)
      .sort((a, b) => b.totalRounds - a.totalRounds);
    return { global: globalStats, users: userStats };
  }
  return { fetchLineupStats };
}
export const { fetchLineupStats } = createFormationUsageService({
  usage: getLineupUsageStats,
  managers: readManagerDirectory,
});
