import 'server-only';
import {
  mapVolatilityStat,
  mapHeatCheckStat,
  mapHunterStat,
  mapRollingAverageStat,
  mapFloorCeilingStat,
  mapPointDistributionStat,
  mapDominanceStat,
  mapPositionChangeStat,
  mapReliabilityStat,
} from '../mappers/performance.mapper';
import {
  queryVolatilityStats,
  queryHeatCheckStats,
  queryHunterStats,
  queryRollingAverageStats,
  queryFloorCeilingStats,
  queryPointDistributionStats,
  queryDominanceStats,
  queryPositionChangesStats,
  queryReliabilityStats,
} from '../queries/performance.query';

export async function fetchVolatilityStats() {
  return (await queryVolatilityStats()).map(mapVolatilityStat);
}
export async function fetchHeatCheckStats() {
  return (await queryHeatCheckStats()).map(mapHeatCheckStat);
}
export async function fetchHunterStats() {
  return (await queryHunterStats()).map(mapHunterStat);
}
export async function fetchRollingAverageStats() {
  return (await queryRollingAverageStats()).map(mapRollingAverageStat);
}
export async function fetchFloorCeilingStats() {
  return (await queryFloorCeilingStats()).map(mapFloorCeilingStat);
}
export async function fetchPointDistributionStats() {
  return (await queryPointDistributionStats()).map(mapPointDistributionStat);
}
export async function fetchDominanceStats() {
  return (await queryDominanceStats()).map(mapDominanceStat);
}
export async function fetchPositionChangesStats() {
  return mapPositionChangeStat(await queryPositionChangesStats());
}
export async function fetchReliabilityStats() {
  return (await queryReliabilityStats()).map(mapReliabilityStat);
}
