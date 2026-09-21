/** Existing last-completed-round HTTP fields; nulls are intentionally preserved. */
export interface LastRoundPlayer {
  player_id: number | null;
  name: string | null;
  team: string | null;
  position: string | null;
  points: number | null;
  owner_name: string | null;
}
export interface LastRoundMVP extends LastRoundPlayer {
  owner_color_index: number | null;
}
export interface LastRoundStats extends LastRoundPlayer {
  price: number | null;
  round_name: string | null;
}
export interface HighestRoundRecord {
  user_name: string | null;
  round_name: string | null;
  points: number | null;
}
