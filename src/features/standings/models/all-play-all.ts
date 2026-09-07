/** Existing virtual head-to-head HTTP fields; zero-game percentages serialize as null. */
export interface AllPlayAllEntry {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number;
  wins: number;
  losses: number;
  ties: number;
  pct: number | null;
}
