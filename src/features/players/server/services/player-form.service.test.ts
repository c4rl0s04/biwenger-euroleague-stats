import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../queries/player-form.query', () => ({ readPlayerForm: vi.fn() }));
import { readPlayerForm } from '../queries/player-form.query';
import { getPlayerRecentScores, getPlayerFormStats } from './player-form.service';
it('exposes only serializable recent-score fields for the requested window', async () => {
  vi.mocked(readPlayerForm).mockResolvedValue(
    new Map([[7, { player_id: 7, recent_scores: '5,X', avg_recent_points: 5, avg_form_score: 1 }]])
  );
  expect(await getPlayerRecentScores(5)).toEqual([{ playerId: 7, recentScores: '5,X' }]);
  expect(readPlayerForm).toHaveBeenCalledWith(5);
});

it('exposes player form statistics for the requested window', async () => {
  vi.mocked(readPlayerForm).mockResolvedValue(
    new Map([[7, { player_id: 7, recent_scores: '5,X', avg_recent_points: 5, avg_form_score: 1 }]])
  );
  expect(await getPlayerFormStats(5)).toEqual([
    { playerId: 7, recentScores: '5,X', averageRecentPoints: 5, formScore: 1 },
  ]);
  expect(readPlayerForm).toHaveBeenCalledWith(5);
});
