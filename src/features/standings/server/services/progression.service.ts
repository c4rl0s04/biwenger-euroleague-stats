import 'server-only';
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

export async function fetchPointsProgression(limit = 10) {
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
