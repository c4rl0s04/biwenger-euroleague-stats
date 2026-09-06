export interface ManagerTransferViewModel {
  player_id: number | null;
  player_name: string | null;
  price: number | string | null;
  comprador: string | null;
  vendedor: string | null;
  fecha: string | null;
  type: string;
}

export interface ManagerSeasonStatsViewModel {
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
  last_transfers: ManagerTransferViewModel[];
  position: number;
  team_value: number;
  price_trend: number;
}

export interface ManagerSquadPlayerViewModel {
  id: number;
  name: string | null;
  position: string | null;
  team: string | null;
  team_img: string | null;
  team_short_name: string | null;
  price: number | string | null;
  price_increment: number | string | null;
  points: number | string | null;
  average: number | string | null;
  img: string | null;
  recent_scores: string;
}

export interface ManagerSquadViewModel {
  total_value: number;
  price_trend: number;
  total_points: number | string;
  player_count: number;
  position: number;
  top_rising: ManagerSquadPlayerViewModel[];
  top_falling: ManagerSquadPlayerViewModel[];
  players: ManagerSquadPlayerViewModel[];
}

export interface ManagerRoundViewModel {
  round_id: number | null;
  round_name: string | null;
  points: number;
  position: number;
  participated: number;
}

export interface ManagerRoundsViewModel {
  rounds: ManagerRoundViewModel[];
  total_played: number;
  total_rounds: number;
}
