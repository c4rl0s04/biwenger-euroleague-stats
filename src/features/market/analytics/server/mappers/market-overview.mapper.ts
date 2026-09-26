import type { MarketOverviewKPIs, PositionAnalysis } from '../../models/market-overview';
import type {
  MarketOverviewRecord,
  MarketPositionRecord,
} from '../queries/market-overview.records';
export function mapMarketOverview(row: MarketOverviewRecord): MarketOverviewKPIs {
  return {
    totalVolume: parseInt(String(row.total_volume)) || 0,
    totalOps: parseInt(String(row.total_ops)) || 0,
    avgPrice: parseInt(String(row.avg_price)) || 0,
    avgBids: parseFloat(String(row.avg_bids)) || 0,
  };
}
export function mapMarketPositions(rows: MarketPositionRecord[]): PositionAnalysis {
  if (!rows.length) return { mostSigned: null, distribution: [] };
  return {
    mostSigned: { position: rows[0].position, count: parseInt(String(rows[0].count)) },
    distribution: rows.map((row) => ({
      position: row.position,
      count: parseInt(String(row.count)),
      avg_price: parseInt(String(row.avg_price)),
      total_volume: parseInt(String(row.total_volume)),
    })),
  };
}
