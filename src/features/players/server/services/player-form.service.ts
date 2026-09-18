import 'server-only';
import { readPlayerForm } from '../queries/player-form.query';
import type { PlayerFormStatsViewModel } from '../../models/player-insights';

/** Caller selects the existing form window; no extra cache or normalization. */
export async function getPlayerFormStats(rounds = 5): Promise<PlayerFormStatsViewModel[]> {
  const form = await readPlayerForm(rounds);
  return Array.from(form.values(), (row) => ({
    playerId: row.player_id,
    recentScores: row.recent_scores,
    averageRecentPoints: row.avg_recent_points,
    formScore: row.avg_form_score,
  }));
}

export async function getPlayerRecentScores(
  rounds = 5
): Promise<{ playerId: number; recentScores: string }[]> {
  const form = await readPlayerForm(rounds);
  return Array.from(form.values(), (row) => ({
    playerId: row.player_id,
    recentScores: row.recent_scores,
  }));
}
