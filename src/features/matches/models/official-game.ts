/** Existing public HTTP projections. Snake-case item fields are compatibility contracts. */
export interface OfficialPlayViewModel {
  sequence: number;
  provider_play_number: number | null;
  period: number | null;
  minute: number | null;
  marker_time: string | null;
  play_type: string | null;
  team_code: string | null;
  provider_player_code: string | null;
  player_id: number | null;
  player_name: string | null;
  team_name: string | null;
  dorsal: string | null;
  home_score: number | null;
  away_score: number | null;
  comment: string | null;
  play_info: string | null;
}

export interface OfficialShotViewModel {
  annotation_number: number;
  team_code: string | null;
  provider_player_code: string | null;
  player_id: number | null;
  player_name: string | null;
  action_id: string | null;
  action: string | null;
  points: number | null;
  coordinate_x: number | null;
  coordinate_y: number | null;
  zone: string | null;
  is_fastbreak: boolean | null;
  is_second_chance: boolean | null;
  is_points_off_turnover: boolean | null;
  minute: number | null;
  marker_time: string | null;
  home_score: number | null;
  away_score: number | null;
  occurred_at: string | null;
}

export interface OfficialGameViewModel<T> {
  match: { id: number; status: string | null };
  scheduledAt: string | null;
  finalizedAt: string | null;
  items: T[];
}

export type OfficialPlaysViewModel = OfficialGameViewModel<OfficialPlayViewModel>;
export type OfficialShotsViewModel = OfficialGameViewModel<OfficialShotViewModel>;
