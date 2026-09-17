import type {
  MarketTransfer,
  MarketTransferPage,
  MarketValueDetail,
  MarketDuelDetail,
} from '../../models/market-transfers';
import type {
  MarketTransferRecord,
  MarketTransferPageRecords,
  MarketValueDetailRecord,
  MarketDuelDetailRecord,
} from '../queries/market-transfer.records';

export function mapMarketTransfer(row: MarketTransferRecord): MarketTransfer {
  return {
    id: row.id,
    fecha: row.fecha,
    precio: parseInt(String(row.precio)),
    vendedor: row.vendedor,
    comprador: row.comprador,
    vendedor_id: row.vendedor_id || null,
    vendedor_icon: row.vendedor_icon,
    vendedor_color_index: row.vendedor_color_index,
    comprador_id: row.comprador_id || null,
    comprador_icon: row.comprador_icon,
    comprador_color_index: row.comprador_color_index,
    player_id: row.player_id,
    player_name: row.player_name,
    player_position: row.player_position,
    player_img: row.player_img,
    player_team: row.player_team,
    bids_count: parseInt(String(row.bids_count)),
  };
}

export function mapMarketTransferPage(records: MarketTransferPageRecords): MarketTransferPage {
  return {
    transfers: records.rows.map(mapMarketTransfer),
    total: parseInt(String(records.total)),
    page: records.page,
    totalPages: Math.ceil(parseInt(String(records.total)) / records.limit),
  };
}

export function mapMarketValueDetail(row: MarketValueDetailRecord): MarketValueDetail {
  return {
    round_name: row.round_name,
    date: row.date instanceof Date ? row.date.toISOString() : row.date,
    points: parseInt(String(row.points)),
    opponent: row.opponent,
    team_id: row.team_id,
  };
}

export function mapMarketDuelDetail(row: MarketDuelDetailRecord): MarketDuelDetail {
  return {
    transfer_id: parseInt(String(row.transfer_id)),
    transfer_date: row.transfer_date ?? null,
    player_id: parseInt(String(row.player_id)),
    player_name: row.player_name,
    player_img: row.player_img ?? null,
    winner_id: parseInt(String(row.winner_id)),
    winner_name: row.winner_name,
    winner_icon: row.winner_icon ?? null,
    winner_color_index:
      row.winner_color_index !== null ? parseInt(String(row.winner_color_index)) : null,
    runner_id: parseInt(String(row.runner_id)),
    runner_name: row.runner_name,
    runner_icon: row.runner_icon ?? null,
    runner_color_index:
      row.runner_color_index !== null ? parseInt(String(row.runner_color_index)) : null,
    winning_bid: parseInt(String(row.winning_bid)),
    second_bid: parseInt(String(row.second_bid)),
    margin: parseInt(String(row.margin)),
  };
}
