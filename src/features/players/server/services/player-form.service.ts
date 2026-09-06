import 'server-only';
import { readPlayerForm } from '../queries/player-form.query';

export async function getPlayerRecentScores(
  rounds = 5
): Promise<{ playerId: number; recentScores: string }[]> {
  const form = await readPlayerForm(rounds);
  return Array.from(form.values(), (row) => ({
    playerId: row.player_id,
    recentScores: row.recent_scores,
  }));
}
