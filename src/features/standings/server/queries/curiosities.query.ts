import 'server-only';
import {
  getBottlerStats,
  getHeartbreakerStats,
  getNoGloryStats,
  getJinxStats,
  getEfficiencyStats,
} from './performance.query';

import { getDetailedCaptainStats } from './advanced.query';

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
