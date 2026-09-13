/**
 * Represents the recent form data for a single player.
 * - `recent_scores`: comma-separated string of last 5 results, e.g. "12,X,7,0,15"
 *   where 'X' means the player's team played but the player did NOT (DNP/injury).
 * - `avg_recent_points`: average calculated ONLY over rounds where the player appeared.
 *   DNP ('X') rounds are excluded from the average.
 */
export interface PlayerFormEntry {
  player_id: number;
  recent_scores: string;
  avg_recent_points: number; // Average only over rounds played
  avg_form_score: number; // Average over all team rounds in window (DNPs = 0)
}
