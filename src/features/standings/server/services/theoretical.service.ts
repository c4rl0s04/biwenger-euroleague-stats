import 'server-only';
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
  queryTheoreticalStandings,
} from '../queries/theoretical.query';

export async function fetchTheoreticalGapStats() {
  return (await queryTheoreticalGapStats()).map(mapTheoreticalGapStat);
}
export async function fetchLeagueComparisonStats() {
  return (await queryLeagueComparisonStats()).map(mapLeagueComparisonStat);
}
export async function fetchRivalryMatrixStats() {
  return mapRivalryMatrixStat(await queryRivalryMatrixStats());
}
export async function fetchHeatmapStats() {
  return mapHeatmapStat(await queryHeatmapStats());
}
export async function fetchTheoreticalStandings() {
  return (await queryTheoreticalStandings()).map(mapTheoreticalStandingsStat);
}
