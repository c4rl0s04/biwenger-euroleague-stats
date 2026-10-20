import { expect, it, vi } from 'vitest';
import { preparePlayerStatMutations } from '../player-stats';

it('preserves a known score on null input without touching sporting fields', async () => {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  await preparePlayerStatMutations({ query } as never, '2026-27').updateFantasyPoints({
    playerId: 101,
    roundId: 5136,
    fantasyPoints: null,
  });
  const [sql, params] = query.mock.calls[0];
  expect(sql).toContain('COALESCE(EXCLUDED.fantasy_points, player_round_stats.fantasy_points)');
  expect(sql).not.toContain('points = EXCLUDED.points');
  expect(params).toEqual(['2026-27', 101, 5136, null]);
});
