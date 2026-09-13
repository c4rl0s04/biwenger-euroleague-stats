import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('@/features/player-form/server', () => ({ getPlayerFormMap: fake.read }));
import { getPlayerFormStats, getPlayerRecentScores } from './player-form.service';
beforeEach(() => {
  vi.clearAllMocks();
  fake.read.mockResolvedValue(new Map());
});
describe('deliberate full Player form contract', () => {
  it('exposes the existing calculations without leaking raw records or changing the score-only contract', async () => {
    fake.read.mockResolvedValue(
      new Map([
        [
          7,
          {
            player_id: 7,
            recent_scores: '30,X,30',
            avg_recent_points: 30,
            avg_form_score: 20,
            credential: 'synthetic-canary',
          },
        ],
      ])
    );
    expect(await getPlayerFormStats(3)).toEqual([
      { playerId: 7, recentScores: '30,X,30', averageRecentPoints: 30, formScore: 20 },
    ]);
    expect(await getPlayerRecentScores(3)).toEqual([{ playerId: 7, recentScores: '30,X,30' }]);
    expect(fake.read.mock.calls).toEqual([[3], [3]]);
  });
  it('preserves empty/error behavior and the default window without caching', async () => {
    expect(await getPlayerFormStats()).toEqual([]);
    expect(fake.read).toHaveBeenCalledWith(5);
    const failure = new Error('synthetic-failure');
    fake.read.mockRejectedValue(failure);
    await expect(getPlayerFormStats()).rejects.toBe(failure);
  });
});
