import type { RecentTransfer, PriceChange } from '../../models/market-activity-extra';
import type {
  RecentTransferRecord,
  PriceChangeRecord,
} from '../queries/market-activity-extra.records';
export function mapRecentTransfer(row: RecentTransferRecord): RecentTransfer {
  return {
    id: row.id,
    season_id: row.season_id,
    timestamp: row.timestamp,
    fecha: row.fecha,
    player_id: row.player_id,
    precio: row.precio,
    vendedor: row.vendedor,
    comprador: row.comprador,
    player_name: row.player_name,
    position: row.position,
    vendedor_id: row.vendedor_id,
    vendedor_color_index: row.vendedor_color_index,
    comprador_id: row.comprador_id,
    comprador_color_index: row.comprador_color_index,
  };
}
export function mapPriceChange(row: PriceChangeRecord): PriceChange {
  return {
    player_id: row.player_id,
    name: row.name,
    position: row.position,
    team: row.team,
    price: row.price,
    price_increment: row.price_increment,
    owner_id: row.owner_id,
  };
}
