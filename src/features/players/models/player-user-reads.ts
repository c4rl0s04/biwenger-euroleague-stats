export interface PlayerUserTransferViewModel {
  player_id: number;
  player_name: string;
  price: number;
  comprador: string;
  vendedor: string;
  fecha: string;
  type: string;
}

export interface PlayerUserSeasonStatsViewModel {
  id: string;
  name: string;
  icon: string;
  color_index: number;
  total_points: number;
  best_round: number;
  worst_round: number;
  average_points: number;
  rounds_played: number;
  best_position: number;
  worst_position: number;
  average_position: number;
  victories: number;
  podiums: number;
  purchases: number;
  sales: number;
  total_spent: number;
  total_received: number;
  last_transfers: PlayerUserTransferViewModel[];
  position: number;
  team_value: number;
  price_trend: number;
}

export interface PlayerUserSquadPlayerViewModel {
  id: number;
  name: string;
  position: string;
  team: string;
  team_img: string;
  team_short_name: string;
  price: number;
  price_increment: number;
  points: number;
  average: number;
  img: string;
  recent_scores: string;
}

export interface PlayerUserSquadViewModel {
  total_value: number;
  price_trend: number;
  total_points: number;
  player_count: number;
  position: number;
  top_rising: PlayerUserSquadPlayerViewModel[];
  top_falling: PlayerUserSquadPlayerViewModel[];
  players: PlayerUserSquadPlayerViewModel[];
}

export interface PlayerUserRoundViewModel {
  round_id: number;
  round_name: string;
  points: number;
  position: number;
  participated: number;
}

export interface PlayerUserRoundsViewModel {
  rounds: PlayerUserRoundViewModel[];
  total_played: number;
  total_rounds: number;
}
