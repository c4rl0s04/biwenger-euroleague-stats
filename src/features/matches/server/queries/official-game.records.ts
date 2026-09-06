/** Query projections, kept independent of the public HTTP models. */
export interface OfficialPlayRow {
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

export interface OfficialShotRow {
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
  occurred_at: Date | string | null;
}

export interface OfficialGameRow<T> {
  match: { id: number; status: string | null };
  scheduledAt: Date | string | null;
  finalizedAt: Date | string | null;
  items: T[];
}
