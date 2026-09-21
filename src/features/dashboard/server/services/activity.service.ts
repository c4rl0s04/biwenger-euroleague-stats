import 'server-only';
import {
  getRecentTransfers,
  getSignificantPriceChanges,
  getHighestTransferRecord,
  getBiggestGainRecord,
} from '@/features/market/server';
import { getHighestRoundSnapshot } from '@/features/rounds/server';
import { getManagerPersonalizedAlerts } from '@/features/managers/server';
import { mapDashboardRecords } from '../mappers/dashboard.mapper';
import type { RecentActivityDashboard } from '../../models/dashboard';

export const DASHBOARD_ACTIVITY_POLICY = {
  access: 'public-statistics-explicit-optional-manager-no-session-fallback',
  serverCache: 'none',
  publicHttpSeconds: 60,
  personalizedHttp: 'private-no-store',
} as const;
export function createDashboardActivityService(deps: {
  round: typeof getHighestRoundSnapshot;
  transfer: typeof getHighestTransferRecord;
  gain: typeof getBiggestGainRecord;
  transfers: typeof getRecentTransfers;
  prices: typeof getSignificantPriceChanges;
  alerts: typeof getManagerPersonalizedAlerts;
}) {
  async function getRecentRecords() {
    // Keep the original sequential reads and single season snapshot across domain owners.
    const { seasonId, record } = await deps.round();
    const transfer = await deps.transfer(seasonId);
    const gain = await deps.gain(seasonId);
    return mapDashboardRecords(record, transfer, gain);
  }
  return {
    getRecentRecords,
    async getRecentActivityData(
      userId: string | number | null = null
    ): Promise<RecentActivityDashboard> {
      const [recentTransfers, priceChanges, recentRecords, personalizedAlerts] = await Promise.all([
        deps.transfers(8),
        deps.prices(24, 500000),
        getRecentRecords(),
        userId ? deps.alerts(userId, 5) : [],
      ]);
      return { recentTransfers, priceChanges, recentRecords, personalizedAlerts };
    },
  };
}
export const { getRecentRecords, getRecentActivityData } = createDashboardActivityService({
  round: getHighestRoundSnapshot,
  transfer: getHighestTransferRecord,
  gain: getBiggestGainRecord,
  transfers: getRecentTransfers,
  prices: getSignificantPriceChanges,
  alerts: getManagerPersonalizedAlerts,
});
