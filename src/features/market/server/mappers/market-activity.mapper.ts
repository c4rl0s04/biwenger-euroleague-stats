import type {
  MarketActivityTransfer,
  MarketActivityTrend,
  MarketActivityKPIs,
} from '../../models/market-activity';
import type {
  MarketActivityTransferRecord,
  MarketActivityTrendRecord,
  MarketActivityKPIRecord,
} from '../queries/market-activity.records';

export function mapMarketActivityTransfer(
  row: MarketActivityTransferRecord
): MarketActivityTransfer {
  return {
    id: row.id,
    fecha: row.fecha,
    player_id: row.player_id,
    precio: row.precio,
    vendedor: row.vendedor,
    comprador: row.comprador,
  };
}

export function mapMarketActivityTrend(row: MarketActivityTrendRecord): MarketActivityTrend {
  return {
    date: row.date,
    count: parseInt(String(row.count)) || 0,
    avg_value: parseFloat(String(row.avg_value)) || 0,
  };
}

export function mapMarketActivityKPIs(
  row: MarketActivityKPIRecord | undefined
): MarketActivityKPIs {
  return {
    total_transfers: parseInt(String(row?.total_transfers)) || 0,
    avg_value: parseFloat(String(row?.avg_value)) || 0,
    max_value: parseInt(String(row?.max_value)) || 0,
    min_value: parseInt(String(row?.min_value)) || 0,
    active_buyers: parseInt(String(row?.active_buyers)) || 0,
    active_sellers: parseInt(String(row?.active_sellers)) || 0,
  };
}
