import { getVolatilityStats } from '@/lib/db';
import {
  getHeatCheckStats,
  getHunterStats,
  getRollingAverageStats,
  getFloorCeilingStats,
  getPointDistributionStats,
  getDominanceStats,
  getPositionChangesStats,
  getReliabilityStats,
} from '@/lib/db';

export async function queryVolatilityStats() {
  return getVolatilityStats();
}
export async function queryHeatCheckStats() {
  return getHeatCheckStats();
}
export async function queryHunterStats() {
  return getHunterStats();
}
export async function queryRollingAverageStats() {
  return getRollingAverageStats();
}
export async function queryFloorCeilingStats() {
  return getFloorCeilingStats();
}
export async function queryPointDistributionStats() {
  return getPointDistributionStats();
}
export async function queryDominanceStats() {
  return getDominanceStats();
}
export async function queryPositionChangesStats() {
  return getPositionChangesStats();
}
export async function queryReliabilityStats() {
  return getReliabilityStats();
}
