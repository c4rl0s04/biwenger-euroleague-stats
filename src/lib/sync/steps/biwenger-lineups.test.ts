import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../repositories/sync-queries', () => ({
  getLiveRounds: vi.fn(async () => []),
  getRoundScheduleState: vi.fn(),
  getPlayerDirectoryMap: vi.fn(),
}));
vi.mock('../services/biwenger/lineups', () => ({ run: vi.fn() }));
import { getRoundScheduleState } from '../repositories/sync-queries';
import { run as synchronize } from '../services/biwenger/lineups';
import { run } from './biwenger-lineups';
const round = { id: 900, name: 'Jornada 7', status: 'pending' };
const manager = {
  mode: 'live',
  context: { seasonId: '2026-27', db: {}, biwenger: { players: {} } },
  getBiwengerCompetition: vi.fn(async () => ({ rounds: [round] })),
  resolveRoundId: vi.fn(() => 5142),
  log: vi.fn(),
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
  vi.mocked(synchronize).mockResolvedValue({ insertedCount: 9 });
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
