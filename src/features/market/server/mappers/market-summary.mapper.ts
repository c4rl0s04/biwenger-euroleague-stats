import type {
  TopTransferredPlayer,
  EnrichedTransfer,
  BigSpender,
  BestSeller,
  MostOwnersPlayer,
  ManagerMarketStats,
} from '../../models/market-summary';
import type {
  TopTransferredPlayerRecord,
  EnrichedTransferRecord,
  BigSpenderRecord,
  BestSellerRecord,
  MostOwnersPlayerRecord,
  ManagerMarketStatsRecord,
} from '../queries/market-summary.records';
export function mapTopTransferredPlayer(row: TopTransferredPlayerRecord): TopTransferredPlayer {
  return {
    player_id: row.player_id,
    name: row.name,
    img: row.img,
    player_team: row.player_team,
    transfer_count: parseInt(String(row.transfer_count)),
    avg_price: parseInt(String(row.avg_price)),
    owner_id: row.owner_id,
    owner_name: row.owner_name,
    owner_color_index: row.owner_color_index,
  };
}
export function mapEnrichedTransfer(row: EnrichedTransferRecord): EnrichedTransfer {
  return {
    id: row.id,
    season_id: row.season_id,
    timestamp: row.timestamp,
    fecha: row.fecha,
    player_id: row.player_id,
    precio: parseInt(String(row.precio)),
    vendedor: row.vendedor,
    comprador: row.comprador,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    team_name: row.team_name,
    team_logo: row.team_logo,
    buyer_id: row.buyer_id,
    buyer_name: row.buyer_name,
    buyer_icon: row.buyer_icon,
    buyer_color: row.buyer_color,
    seller_id: row.seller_id,
    seller_name: row.seller_name,
    seller_icon: row.seller_icon,
    seller_color: row.seller_color,
  };
}
export function mapBigSpender(row: BigSpenderRecord): BigSpender {
  return {
    name: row.name,
    user_id: row.user_id,
    user_color_index: row.user_color_index,
    total_spent: parseInt(String(row.total_spent)),
    purchases_count: parseInt(String(row.purchases_count)),
  };
}
export function mapBestSeller(row: BestSellerRecord): BestSeller {
  return {
    name: row.name,
    user_id: row.user_id,
    user_color_index: row.user_color_index,
    net_profit: parseInt(String(row.net_profit)),
    total_sales: parseInt(String(row.total_sales)),
    sales_count: parseInt(String(row.sales_count)),
  };
}
export function mapMostOwnersPlayer(row: MostOwnersPlayerRecord): MostOwnersPlayer {
  return {
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    team_name: row.team_name,
    team_logo: row.team_logo,
    distinct_owners_count: parseInt(String(row.distinct_owners_count)),
    owner_id: row.owner_id,
    owner_name: row.owner_name,
    owner_color_index: row.owner_color_index,
  };
}
export function mapManagerMarketStats(row: ManagerMarketStatsRecord): ManagerMarketStats {
  return {
    user_id: row.user_id,
    user_icon: row.user_icon,
    color_index: row.color_index,
    user_name: row.user_name,
    purchases_count: parseInt(String(row.purchases_count)),
    purchases_total: parseInt(String(row.purchases_total)),
    sales_count: parseInt(String(row.sales_count)),
    sales_total: parseInt(String(row.sales_total)),
    balance: parseInt(String(row.sales_total)) - parseInt(String(row.purchases_total)),
  };
}
