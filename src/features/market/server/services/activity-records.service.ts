import 'server-only';
import { queryHighestTransfer, queryBiggestGain } from '../queries/activity-records.query';

export const MARKET_RECORDS_POLICY = {
  access: 'public-fantasy-statistics',
  serverCache: 'none',
} as const;
export function createMarketRecordsService(deps: {
  transfer: typeof queryHighestTransfer;
  gain: typeof queryBiggestGain;
}) {
  return {
    async getHighestTransferRecord(seasonId: string) {
      const row = await deps.transfer(seasonId);
      return row
        ? { precio: row.precio, player_name: row.player_name, comprador: row.comprador }
        : null;
    },
    async getBiggestGainRecord(seasonId: string) {
      const row = await deps.gain(seasonId);
      return row ? { name: row.name, price_increment: row.price_increment } : null;
    },
  };
}
export const { getHighestTransferRecord, getBiggestGainRecord } = createMarketRecordsService({
  transfer: queryHighestTransfer,
  gain: queryBiggestGain,
});
