import { getPlacementStats, getStreakStats } from '@/lib/db';
import {
  getRoundWinners,
  getPointsProgression,
  getWinCounts,
} from '@/lib/db/queries/competition/standings';

export async function queryRoundWinners(limit = 15) {
  return getRoundWinners(limit);
}
export async function queryPointsProgression(limit = 10) {
  return getPointsProgression(limit);
}
export async function queryStreakStats() {
  return getStreakStats();
}
export async function queryPlacementStats() {
  return getPlacementStats();
}
