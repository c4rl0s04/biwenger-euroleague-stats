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

export const fetchVolatilityStats = async () => {
  return (await getVolatilityStats()).map(mapVolatilityStat);
};
export const fetchHeatCheckStats = async () => {
  return (await getHeatCheckStats()).map(mapHeatCheckStat);
};
export const fetchHunterStats = async () => {
  return (await getHunterStats()).map(mapHunterStat);
};
export const fetchRollingAverageStats = async () => {
  return (await getRollingAverageStats()).map(mapRollingAverageStat);
};
export const fetchFloorCeilingStats = async () => {
  return (await getFloorCeilingStats()).map(mapFloorCeilingStat);
};
export const fetchPointDistributionStats = async () => {
  return (await getPointDistributionStats()).map(mapPointDistributionStat);
};
export const fetchDominanceStats = async () => {
  return (await getDominanceStats()).map(mapDominanceStat);
};
export const fetchPositionChangesStats = async () => {
  return mapPositionChangeStat(await getPositionChangesStats());
};
export const fetchReliabilityStats = async () => {
  return (await getReliabilityStats()).map(mapReliabilityStat);
};
