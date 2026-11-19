import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../repositories/sync-queries', () => ({
  getRoundManagerResultCoverage: vi.fn(),
  getRoundScheduleState: vi.fn(),
  getPlayerDirectoryMap: vi.fn(),
}));
vi.mock('../services/biwenger/lineups', () => ({ run: vi.fn() }));
import { getRoundManagerResultCoverage, getRoundScheduleState } from '../repositories/sync-queries';
import { run as synchronize } from '../services/biwenger/lineups';
import { run } from './biwenger-lineups';
const round = { id: 900, name: 'Jornada 7', status: 'pending' };
const manager = {
  mode: 'live',
  context: { seasonId: '2026-27', db: {}, biwenger: { players: {} } },
  getBiwengerCompetition: vi.fn(async () => ({ rounds: [round] })),
  resolveRoundId: vi.fn(() => 5142),
  log: vi.fn(),
  warn: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRoundScheduleState).mockResolvedValue({
    matchCount: 10,
    firstMatchDate: new Date('2020-01-01'),
    lastMatchDate: new Date('2099-01-01'),
    allFinished: false,
    hasLineups: true,
  });
  vi.mocked(getRoundManagerResultCoverage).mockResolvedValue([]);
  vi.mocked(synchronize).mockResolvedValue({
    insertedCount: 9,
    fetchedManagers: 1,
    acceptedLineups: 1,
    persistedResults: 0,
  });
});
it('retrieves a started pending round between game days even with partial saved rows', async () => {
  await run(manager as never);
  expect(manager.getBiwengerCompetition).toHaveBeenCalledTimes(1);
  expect(synchronize).toHaveBeenCalledTimes(1);
  expect(synchronize).toHaveBeenCalledWith(
    manager,
    expect.objectContaining({ id: 900, status: 'active' }),
    {}
  );
});
it('does not fetch a future round', async () => {
  vi.mocked(getRoundScheduleState).mockResolvedValue({
    matchCount: 10,
    firstMatchDate: new Date('2099-01-01'),
    lastMatchDate: new Date('2099-01-03'),
    allFinished: false,
  });
  await run(manager as never);
  expect(synchronize).not.toHaveBeenCalled();
});

it('repairs only the requested canonical round beyond the normal finish window', async () => {
  vi.mocked(getRoundScheduleState).mockResolvedValue({
    matchCount: 10,
    firstMatchDate: new Date('2020-01-01'),
    lastMatchDate: new Date('2020-01-03'),
    allFinished: true,
  });
  await run(manager as never);
  expect(synchronize).not.toHaveBeenCalled();
  await run({ ...manager, forceRound: 5142 } as never);
  expect(synchronize).toHaveBeenCalledTimes(1);
});

it('reports an old finished round with saved lineups but no results without re-fetching it', async () => {
  const finished = { ...round, name: 'Jornada 10', status: 'finished' };
  manager.getBiwengerCompetition.mockResolvedValueOnce({ rounds: [finished] });
  manager.resolveRoundId.mockReturnValueOnce(5145);
  vi.mocked(getRoundScheduleState).mockResolvedValueOnce({
    matchCount: 10,
    firstMatchDate: new Date('2020-01-01'),
    lastMatchDate: new Date('2020-01-03'),
    allFinished: true,
  });
  vi.mocked(getRoundManagerResultCoverage).mockResolvedValueOnce([
    { roundId: 5145, expected: 6, missing: 6, missingLineups: 0 },
  ]);

  const result = await run(manager as never);

  expect(synchronize).not.toHaveBeenCalled();
  expect(getRoundManagerResultCoverage).toHaveBeenCalledWith('2026-27', [5145], manager.context.db);
  expect(manager.warn).toHaveBeenCalledWith(
    'Lineup round 5145: incomplete final results (6/6 managers missing).'
  );
  expect(result.counts).toMatchObject({ incompleteRounds: 1, missingResults: 6, skippedRounds: 1 });
});

it('reports empty standings without treating them as a provider failure', async () => {
  vi.mocked(synchronize).mockResolvedValueOnce({
    insertedCount: 0,
    fetchedManagers: 0,
    acceptedLineups: 0,
    persistedResults: 0,
  });

  const result = await run(manager as never);

  expect(result.counts).toMatchObject({ emptyRounds: 1, failedRounds: 0, incompleteRounds: 0 });
  expect(manager.log).toHaveBeenCalledWith('Lineup round 5142: provider returned empty standings.');
});

it('propagates provider failures as a failed step', async () => {
  const failure = new Error('provider unavailable');
  vi.mocked(synchronize).mockRejectedValueOnce(failure);

  await expect(run(manager as never)).rejects.toBe(failure);
  expect(manager.log).toHaveBeenCalledWith(expect.stringContaining('"failedRounds":1'));
  expect(manager.warn).not.toHaveBeenCalled();
});

it.each([
  {
    coverage: [],
    warning: 'no saved lineups or final results; coverage unverified.',
    missingLineups: 0,
    unverifiedRounds: 1,
  },
  {
    coverage: [{ roundId: 5145, expected: 3, missing: 0, missingLineups: 2 }],
    warning: '2 participating managers lack saved lineups.',
    missingLineups: 2,
    unverifiedRounds: 0,
  },
])(
  'detects incomplete old rounds from both sides of the stored data',
  async ({ coverage, warning, missingLineups, unverifiedRounds }) => {
    manager.getBiwengerCompetition.mockResolvedValueOnce({
      rounds: [{ ...round, name: 'Jornada 10', status: 'finished' }],
    });
    manager.resolveRoundId.mockReturnValueOnce(5145);
    vi.mocked(getRoundScheduleState).mockResolvedValueOnce({
      matchCount: 10,
      firstMatchDate: new Date('2020-01-01'),
      lastMatchDate: new Date('2020-01-03'),
      allFinished: true,
    });
    vi.mocked(getRoundManagerResultCoverage).mockResolvedValueOnce(coverage);

    const result = await run(manager as never);

    expect(synchronize).not.toHaveBeenCalled();
    expect(manager.warn).toHaveBeenCalledExactlyOnceWith(`Lineup round 5145: ${warning}`);
    expect(result.counts).toMatchObject({
      incompleteRounds: 1,
      missingResults: 0,
      missingLineups,
      unverifiedRounds,
    });
  }
);
