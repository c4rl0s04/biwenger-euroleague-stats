export interface PlayerTopPerformerViewModel {
  id: number;
  name: string;
  img: string;
  team_id: number | null;
  team_name: string;
  team_code: string;
  position: string;
  price: number;
  points: number;
  average: number;
  owner_id: number | string | null;
  owner_name: string | null;
  owner_color_index: number;
  recent_scores: string | null;
}

export interface PlayerRecentFormViewModel {
  id: number;
  name: string;
  position: string;
  img: string;
  team_id: number | null;
  team_name: string;
  team_code: string;
  team_img: string;
  owner_id: number | string | null;
  owner_name: string | null;
  owner_color_index: number;
  total_points: number;
  games_played: number;
  avg_points: number;
  recent_scores: string;
}

export interface PlayerRisingStarViewModel {
  id: number;
  name: string;
  team_id: number | null;
  team_name: string;
  team_code: string;
  position: string;
  recent_avg: number;
  earlier_avg: number;
  improvement: number;
  improvement_pct: number;
  owner_name: string | null;
  owner_color_index: number;
}

export interface PlayerBirthdayViewModel {
  id: number;
  name: string;
  team_id: number | null;
  team_name: string;
  team_code: string;
  position: string;
  birth_date: string | null;
  owner_name: string | null;
  owner_color_index: number;
}

export interface PlayerStatLeaderViewModel {
  player_id: number;
  name: string;
  team_id: number | null;
  team_name: string;
  team_code: string;
  owner_id: number | string | null;
  owner_name: string | null;
  owner_color_index: number;
  value: number;
  // PostgreSQL COUNT is serialized as text in the established HTTP contract.
  games_played: string;
  avg_value: number;
}
