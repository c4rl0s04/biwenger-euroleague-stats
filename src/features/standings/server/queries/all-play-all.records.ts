export interface AllPlayAllUserRecord {
  id: string;
  name: string | null;
  icon: string | null;
  color_index: number;
}

export interface AllPlayAllRoundRecord {
  round_id: number | null;
}
export interface AllPlayAllScoreRecord {
  user_id: string;
  points: number | null;
}

/** Legacy cache payload retains NaN before the serializable boundary mapper. */
export interface AllPlayAllComputedRecord {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number;
  wins: number;
  losses: number;
  ties: number;
  pct: number;
}
