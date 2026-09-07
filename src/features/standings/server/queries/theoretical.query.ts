import 'server-only';
import { getTheoreticalGapStats, getRivalryMatrixStats, getHeatmapStats } from './advanced.query';
import { getLeagueComparisonStats } from './performance.query';

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
