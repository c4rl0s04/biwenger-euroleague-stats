import type {
  BestRevaluation,
  BestValuePlayer,
  InfirmaryPlayer,
  SingleFlip,
  PercentageGain,
  MissedOpportunity,
  TopTrader,
  ProfitablePlayer,
  LossyPlayer,
  QuickFlip,
  LongHold,
  Devaluation,
} from '../../models/market-investments';
import type {
  BestRevaluationRecord,
  BestValuePlayerRecord,
  InfirmaryPlayerRecord,
  SingleFlipRecord,
  PercentageGainRecord,
  MissedOpportunityRecord,
  TopTraderRecord,
  ProfitablePlayerRecord,
  LossyPlayerRecord,
  QuickFlipRecord,
  LongHoldRecord,
  DevaluationRecord,
} from '../queries/market-investments.records';
export function mapBestRevaluation(row: BestRevaluationRecord): BestRevaluation {
  return {
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    team_name: row.team_name,
    team_logo: row.team_logo,
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    current_price: parseInt(String(row.current_price)),
    purchase_price: parseInt(String(row.purchase_price)),
    revaluation: parseInt(String(row.revaluation)),
  };
}
export function mapBestValuePlayer(row: BestValuePlayerRecord): BestValuePlayer {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    transfer_id: row.transfer_id,
    purchase_price: parseInt(String(row.purchase_price)),
    total_points: parseInt(String(row.total_points)),
    points_per_million: parseFloat(String(row.points_per_million)),
  };
}
export function mapInfirmaryPlayer(row: InfirmaryPlayerRecord): InfirmaryPlayer {
  return {
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    purchase_price: parseInt(String(row.purchase_price)),
    available_rounds: parseInt(String(row.available_rounds)),
    played_rounds: parseInt(String(row.played_rounds)),
    missed_rounds: parseInt(String(row.missed_rounds)),
  };
}
export function mapSingleFlip(row: SingleFlipRecord): SingleFlip {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    purchase_price: parseInt(String(row.purchase_price)),
    sale_price: parseInt(String(row.sale_price)),
    profit: parseInt(String(row.profit)),
  };
}
export function mapPercentageGain(row: PercentageGainRecord): PercentageGain {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    current_price: parseInt(String(row.current_price)),
    purchase_price: parseInt(String(row.purchase_price)),
    percentage_gain: parseFloat(String(row.percentage_gain)),
  };
}
export function mapMissedOpportunity(row: MissedOpportunityRecord): MissedOpportunity {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    sale_price: parseInt(String(row.sale_price)),
    current_price: parseInt(String(row.current_price)),
    is_repurchase: !!row.is_repurchase,
    missed_profit: parseInt(String(row.missed_profit)),
  };
}
export function mapTopTrader(row: TopTraderRecord): TopTrader {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    trade_count: parseInt(String(row.trade_count)),
    total_profit: parseInt(String(row.total_profit)),
  };
}
export function mapProfitablePlayer(row: ProfitablePlayerRecord): ProfitablePlayer {
  return {
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    trade_count: parseInt(String(row.trade_count)),
    total_profit: parseInt(String(row.total_profit)),
  };
}
export function mapLossyPlayer(row: LossyPlayerRecord): LossyPlayer {
  return {
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    trade_count: parseInt(String(row.trade_count)),
    total_loss: parseInt(String(row.total_loss)),
  };
}
export function mapQuickFlip(row: QuickFlipRecord): QuickFlip {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    purchase_price: parseInt(String(row.purchase_price)),
    sale_price: parseInt(String(row.sale_price)),
    profit: parseInt(String(row.profit)),
    hours_held: parseFloat(String(row.hours_held)),
  };
}
export function mapLongHold(row: LongHoldRecord): LongHold {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    purchase_price: parseInt(String(row.purchase_price)),
    sale_price: parseInt(String(row.sale_price)),
    profit: parseInt(String(row.profit)),
    days_held: parseFloat(String(row.days_held)),
  };
}
export function mapDevaluation(row: DevaluationRecord): Devaluation {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    player_team: row.player_team,
    team_name: row.team_name,
    team_logo: row.team_logo,
    current_price: parseInt(String(row.current_price)),
    purchase_price: parseInt(String(row.purchase_price)),
    devaluation: parseInt(String(row.devaluation)),
  };
}
