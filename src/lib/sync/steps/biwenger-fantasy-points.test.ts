import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  active: vi.fn(),
  live: vi.fn(),
  query: vi.fn(),
}));
vi.mock('../../api/biwenger-client', () => ({ fetchRoundGames: mocks.fetch }));
vi.mock('../repositories/sync-queries', () => ({
  hasActiveMatchesInWindow: mocks.active,
  getFantasyPointLiveRounds: mocks.live,
}));
import { run } from './biwenger-fantasy-points';

const rounds = [
  { id: 1, name: 'Jornada 1', status: 'finished' },
  { id: 2, name: 'Jornada 2', status: 'active' },
  { id: 3, name: 'Jornada 3', status: 'pending' },
  { id: 4, name: 'Jornada 4', status: 'pending' },
];
function manager(mode = 'routine') {
  return {
    mode,
    context: { seasonId: '2026-27', db: { query: mocks.query } },
    getBiwengerCompetition: vi.fn().mockResolvedValue({ rounds }),
    resolveRoundId: (round: { id: number }) => round.id,
    warn: vi.fn(),
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.active.mockImplementation(async (_season, id) => id === 3);
  mocks.live.mockResolvedValue([{ id: 1 }, { id: 2 }]);
  mocks.query.mockResolvedValue({ rows: [] });
  mocks.fetch.mockImplementation(async () => ({
    data: {
      games: [
        {
          date: Date.UTC(2026, 9, 1) / 1000,
          home: { reports: [{ player: { id: 10 }, points: 0 }] },
        },
      ],
    },
  }));
});
it.each(['routine', 'bootstrap'])(
  '%s refreshes completed, active and started pending rounds, skipping future-only rounds',
  async (mode) => {
    const result = await run(manager(mode) as never);
    expect(mocks.fetch.mock.calls.map(([id]) => id)).toEqual([1, 2, 3]);
    expect(result.counts).toEqual({
      selectedRounds: 3,
      rounds: 3,
      reports: 3,
      playerScores: 3,
      missingScores: 0,
    });
    expect(mocks.query).toHaveBeenCalledTimes(3);
  }
);
it('live includes a recently finished round and excludes older/future rounds using its own selector', async () => {
  const m = manager('live');
  await run(m as never);
  expect(mocks.live).toHaveBeenCalledWith('2026-27', m.context.db);
  expect(mocks.fetch.mock.calls.map(([id]) => id)).toEqual([1, 2]);
  expect(mocks.active).not.toHaveBeenCalled();
});
it('rejects another provider season before any writes in standalone recovery', async () => {
  mocks.fetch.mockResolvedValue({ data: { games: [{ date: Date.UTC(2025, 9, 1) / 1000 }] } });
  await expect(run(manager('bootstrap') as never)).rejects.toThrow('expected 2026');
  expect(mocks.query).not.toHaveBeenCalled();
});
it('warns on completed rounds with no scores without manufacturing zeros', async () => {
  mocks.fetch.mockResolvedValue({ data: { games: [{ date: Date.UTC(2026, 9, 1) / 1000 }] } });
  const m = manager();
  const result = await run(m as never);
  expect(result.counts.playerScores).toBe(0);
  expect(m.warn).toHaveBeenCalledWith('Completed round 1 returned no usable fantasy scores.');
  expect(mocks.query).not.toHaveBeenCalled();
});
it('does not fetch or warn on an idle live run', async () => {
  mocks.live.mockResolvedValue([]);
  const m = manager('live');
  await run(m as never);
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(m.warn).not.toHaveBeenCalled();
});
