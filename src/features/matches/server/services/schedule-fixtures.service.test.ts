import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../queries/schedule-fixtures.query', () => ({
  getScheduleRounds: vi.fn(),
  getRoundById: vi.fn(),
  getLastRound: vi.fn(),
  fetchMatchesForRound: vi.fn(),
}));
import { createScheduleFixturesService } from './schedule-fixtures.service';

it('allowlists fixture projections, preserves nulls, converts dates and never caches calls', async () => {
  const date = new Date('2025-10-01T18:00:00Z');
  const round = { round_id: null, round_name: null };
  const deps = {
    getScheduleRounds: vi.fn(async () => [{ ...round, min_date: date }]),
    getRoundById: vi.fn(async () => round),
    getLastRound: vi.fn(async () => round),
    fetchMatchesForRound: vi.fn(async () => [
      {
        match_id: 1,
        date,
        home_id: null,
        away_id: 2,
        home_team: null,
        away_team: 'Away',
        home_code: 'MAD',
        away_code: 'BAR',
        ignored: 'not public',
      },
    ]),
  };
  const service = createScheduleFixturesService(deps);
  expect(await service.getScheduleRoundOptions()).toEqual([
    { roundId: null, roundName: null, firstMatchDate: date.toISOString() },
  ]);
  expect(await service.findScheduleRound(7)).toEqual({ roundId: null, roundName: null });
  expect(await service.getLatestDatedScheduleRound()).toEqual({ roundId: null, roundName: null });
  const fixtures = await service.getScheduleFixtures(7);
  expect(fixtures).toEqual([
    {
      id: 1,
      date: date.toISOString(),
      homeId: null,
      awayId: 2,
      homeName: null,
      awayName: 'Away',
      homeCode: 'MAD',
      awayCode: 'BAR',
    },
  ]);
  expect(JSON.parse(JSON.stringify(fixtures))).toEqual(fixtures);
  await service.getScheduleFixtures(7);
  expect(deps.fetchMatchesForRound).toHaveBeenCalledTimes(2);
});
