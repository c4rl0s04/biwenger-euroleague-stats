import 'server-only';

/** Access: public league statistics, no session identity. Freshness: no service cache;
 * existing query caches and each HTTP adapter's headers remain authoritative.
 * These queries are uncached; errors retain the existing query/route behavior.
 */
import {
  mapRoundWinner,
  mapPointsProgression,
  mapStreakStat,
  mapPlacementStat,
} from '../mappers/progression.mapper';
import {
  queryRoundWinners,
  queryPointsProgression,
  queryStreakStats,
  queryPlacementStats,
} from '../queries/progression.query';

export async function fetchRoundWinners(limit = 15) {
  const records = await queryRoundWinners(limit);
  return records.map(mapRoundWinner);
}

export async function fetchPointsProgression(limit = 50) {
  const records = await queryPointsProgression(limit);
  return records.map(mapPointsProgression);
}

export async function fetchStreakStats() {
  const records = await queryStreakStats();
  return records.map(mapStreakStat);
}

export async function fetchPlacementStats() {
  const records = await queryPlacementStats();
  return records.map(mapPlacementStat);
}
