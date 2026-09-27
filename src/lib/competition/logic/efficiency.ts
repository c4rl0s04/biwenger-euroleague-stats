/**
 * Canonical efficiency calculation for lineup/coach rating.
 *
 * Rules:
 *  - Returns 0 when neither actual nor ideal > 0 (not participated).
 *  - Returns 100 when ideal is 0 but actual > 0 (defensive fallback).
 *  - No artificial 100% cap: if the calculation is correct, potential >= actual naturally.
 *    Efficiency > 100 signals a data integrity issue (e.g. 2+ ghost players in a round).
 *
 * Use this function everywhere efficiency is displayed so the result is
 * consistent across the standings table, heatmap, coach rating card, and
 * user history.
 */
export function calcEfficiency(actual: number, ideal: number): number {
  if (ideal <= 0) return actual > 0 ? 100 : 0;
  return Math.round((actual / ideal) * 100);
}
