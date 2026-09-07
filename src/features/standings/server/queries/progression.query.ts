import 'server-only';
import { getPlacementStats, getStreakStats } from './performance.query';
import { getRoundWinners, getPointsProgression, getWinCounts } from './base.query';

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
