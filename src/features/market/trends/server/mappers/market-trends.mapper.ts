import type { MarketTrendDay } from '../../models/market-trends';
import type { MarketTrendRecord } from '../queries/market-trends.query';

export function mapMarketTrend(row: MarketTrendRecord): MarketTrendDay {
  return {
    date: row.date,
    volume: parseInt(String(row.volume)),
    avg_price: parseInt(String(row.avg_price)),
    ops_count: parseInt(String(row.ops_count)),
    transfers: (row.transfers || []).map((transfer) => ({
      player_name: transfer.player_name,
      price: transfer.price,
    })),
  };
}
