import type {
  RecordBid,
  TheThief,
  BiggestSteal,
  TheVictim,
  OverpayerManager,
  InflatedPlayer,
} from '../../models/market-auctions';
import type {
  RecordBidRecord,
  TheThiefRecord,
  BiggestStealRecord,
  TheVictimRecord,
  OverpayerManagerRecord,
  InflatedPlayerRecord,
} from '../queries/market-auctions.records';
export function mapRecordBid(row: RecordBidRecord): RecordBid {
  return {
    transfer_id: row.transfer_id,
    bid_count: parseInt(String(row.bid_count)) + 1,
    player_id: row.player_id,
    precio: row.precio,
    comprador: row.comprador,
    buyer_id: row.buyer_id,
    buyer_color_index: row.buyer_color_index,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    team_name: row.team_name,
    team_logo: row.team_logo,
  };
}
export function mapTheThief(row: TheThiefRecord): TheThief {
  return {
    name: row.name,
    user_id: row.user_id,
    user_color_index: row.user_color_index,
    stolen_count: parseInt(String(row.stolen_count)),
  };
}
export function mapBiggestSteal(row: BiggestStealRecord): BiggestSteal {
  return {
    transfer_id: row.transfer_id,
    winning_price: parseInt(String(row.winning_price)),
    winner: row.winner,
    winner_id: row.winner_id,
    winner_color_index: row.winner_color_index,
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    second_highest_bid: parseInt(String(row.second_highest_bid)),
    second_bidder_name: row.second_bidder_name,
    price_diff: parseInt(String(row.price_diff)),
  };
}
export function mapTheVictim(row: TheVictimRecord): TheVictim {
  return {
    name: row.name,
    user_id: row.user_id,
    user_color_index: row.user_color_index,
    failed_bids_count: parseInt(String(row.failed_bids_count)),
  };
}
export function mapOverpayerManager(row: OverpayerManagerRecord): OverpayerManager {
  return {
    name: row.name,
    user_id: row.user_id,
    user_color_index: row.user_color_index,
    contested_wins: parseInt(String(row.contested_wins)),
    total_overpay: parseInt(String(row.total_overpay)),
    avg_overpay: parseFloat(String(row.avg_overpay)),
  };
}
export function mapInflatedPlayer(row: InflatedPlayerRecord): InflatedPlayer {
  return {
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    inflation: parseInt(String(row.inflation)),
    purchase_price: parseInt(String(row.purchase_price)),
    market_price: parseInt(String(row.market_price)),
    buyer_id: row.buyer_id,
    buyer_name: row.buyer_name,
    buyer_color: row.buyer_color,
    transfer_id: row.transfer_id,
  };
}
