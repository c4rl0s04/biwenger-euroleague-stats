import 'server-only';
import { cache } from 'react';
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
import { getVolatilityStats } from '../queries/performance.query';
import {
  getHeatCheckStats,
  getHunterStats,
  getRollingAverageStats,
  getFloorCeilingStats,
  getPointDistributionStats,
  getDominanceStats,
  getPositionChangesStats,
  getReliabilityStats,
} from '../queries/advanced.query';

export const fetchVolatilityStats = cache(async () => {
  return (await getVolatilityStats()).map(mapVolatilityStat);
});
export const fetchHeatCheckStats = cache(async () => {
  return (await getHeatCheckStats()).map(mapHeatCheckStat);
});
export const fetchHunterStats = cache(async () => {
  return (await getHunterStats()).map(mapHunterStat);
});
export const fetchRollingAverageStats = cache(async () => {
  return (await getRollingAverageStats()).map(mapRollingAverageStat);
});
export const fetchFloorCeilingStats = cache(async () => {
  return (await getFloorCeilingStats()).map(mapFloorCeilingStat);
});
export const fetchPointDistributionStats = cache(async () => {
  return (await getPointDistributionStats()).map(mapPointDistributionStat);
});
export const fetchDominanceStats = cache(async () => {
  return (await getDominanceStats()).map(mapDominanceStat);
});
export const fetchPositionChangesStats = cache(async () => {
  return mapPositionChangeStat(await getPositionChangesStats());
});
export const fetchReliabilityStats = cache(async () => {
  return (await getReliabilityStats()).map(mapReliabilityStat);
});
