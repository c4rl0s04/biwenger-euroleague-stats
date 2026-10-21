import { expect, it, vi } from 'vitest';
import { syncFantasyPoints } from '../fantasy-points';

function fixture(reports: unknown[]) {
  const updateFantasyPoints = vi.fn().mockResolvedValue(undefined);
  const manager = { context: { db: {}, seasonId: '2026-27' }, warn: vi.fn() };
  const dependencies = {
    fetchRoundGames: vi.fn().mockResolvedValue({ data: { games: [{ home: { reports } }] } }),
    prepareMutations: () => ({ updateFantasyPoints }),
  };
  return { manager, dependencies, updateFantasyPoints };
}
const round = { id: 5136, dbId: 5136, name: 'Jornada 1' };

it('writes zero, negative and revised scores but skips missing scores', async () => {
  const f = fixture(
    [0, -2, 15, null, undefined].map((points, i) => ({ player: { id: i + 1 }, points }))
  );
  expect(await syncFantasyPoints(f.manager as never, round, f.dependencies)).toEqual({
    reports: 5,
    playerScores: 3,
    missingScores: 2,
  });
  expect(f.updateFantasyPoints.mock.calls.map(([v]) => v.fantasyPoints)).toEqual([0, -2, 15]);
  f.dependencies.fetchRoundGames.mockResolvedValue({
    data: { games: [{ home: { reports: [{ player: { id: 1 }, points: -1 }] } }] },
  });
  await syncFantasyPoints(f.manager as never, round, f.dependencies);
  expect(f.updateFantasyPoints).toHaveBeenLastCalledWith({
    playerId: 1,
    roundId: 5136,
    fantasyPoints: -1,
  });
});

it.each([NaN, Infinity, 1.5, '', '12', {}, 2147483648])(
  'rejects malformed score %j before any writes',
  async (points) => {
    const f = fixture([
      { player: { id: 1 }, points: 5 },
      { player: { id: 2 }, points },
    ]);
    await expect(syncFantasyPoints(f.manager as never, round, f.dependencies)).rejects.toThrow(
      'Invalid Biwenger fantasy report'
    );
    expect(f.updateFantasyPoints).not.toHaveBeenCalled();
  }
);
it.each([0, -1, '1', null])('rejects invalid player identifier %j', async (id) => {
  const f = fixture([{ player: { id }, points: 5 }]);
  await expect(syncFantasyPoints(f.manager as never, round, f.dependencies)).rejects.toThrow(
    'Invalid Biwenger fantasy report'
  );
  expect(f.updateFantasyPoints).not.toHaveBeenCalled();
});
