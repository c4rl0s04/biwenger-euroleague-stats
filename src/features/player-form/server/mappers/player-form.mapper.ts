import type { PlayerFormEntry } from '../../models/player-form';
import type { PlayerFormRow } from '../queries/player-form.query';

export function mapPlayerForm(rows: PlayerFormRow[], limit: number): Map<number, PlayerFormEntry> {
  const map = new Map<number, PlayerFormEntry>();
  for (const row of rows) {
    const scores = (row.recent_scores ?? '').split(',');
    // Calculate form score by treating 'X' as 0 and dividing by the limit
    const totalPoints = scores.reduce((sum: number, s: string) => {
      if (s === 'X') return sum;
      return sum + (parseFloat(s) || 0);
    }, 0);

    // Divide by the requested 'limit' to penalize missing games
    const avgFormScore = totalPoints / limit;

    map.set(Number(row.player_id), {
      player_id: Number(row.player_id),
      recent_scores: row.recent_scores ?? '',
      avg_recent_points: parseFloat(row.avg_recent_points ?? '') || 0,
      avg_form_score: parseFloat(avgFormScore.toFixed(2)),
    });
  }
  return map;
}
