import {
  getBottlerStats,
  getHeartbreakerStats,
  getNoGloryStats,
  getJinxStats,
  getEfficiencyStats,
} from '@/lib/db';

import { getDetailedCaptainStats } from '@/lib/db';

export async function queryBottlerStats() {
  return getBottlerStats();
}
export async function queryHeartbreakerStats() {
  return getHeartbreakerStats();
}
export async function queryNoGloryStats() {
  return getNoGloryStats();
}
export async function queryJinxStats() {
  return getJinxStats();
}
export async function queryEfficiencyStats() {
  return getEfficiencyStats();
}
export async function queryDetailedCaptainStats() {
  return getDetailedCaptainStats();
}
