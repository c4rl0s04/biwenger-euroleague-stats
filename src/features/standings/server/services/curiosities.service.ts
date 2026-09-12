import 'server-only';

/** Access: public league statistics, no session identity. Freshness: no service cache;
 * existing query caches and each HTTP adapter's headers remain authoritative.
 * These queries are uncached; errors retain the existing query/route behavior.
 */
import {
  mapBottlerStat,
  mapHeartbreakerStat,
  mapNoGloryStat,
  mapJinxStat,
  mapEfficiencyStat,
  mapDetailedCaptainStat,
} from '../mappers/curiosities.mapper';
import {
  queryBottlerStats,
  queryHeartbreakerStats,
  queryNoGloryStats,
  queryJinxStats,
  queryEfficiencyStats,
  queryDetailedCaptainStats,
} from '../queries/curiosities.query';

export async function fetchBottlerStats() {
  return (await queryBottlerStats()).map(mapBottlerStat);
}

export async function fetchHeartbreakerStats() {
  return (await queryHeartbreakerStats()).map(mapHeartbreakerStat);
}

export async function fetchNoGloryStats() {
  return (await queryNoGloryStats()).map(mapNoGloryStat);
}

export async function fetchJinxStats() {
  return (await queryJinxStats()).map(mapJinxStat);
}

export async function fetchEfficiencyStats() {
  return (await queryEfficiencyStats()).map(mapEfficiencyStat);
}

export async function fetchDetailedCaptainStats() {
  return (await queryDetailedCaptainStats()).map(mapDetailedCaptainStat);
}
