import { beforeEach, expect, it, vi } from 'vitest';
import { getStandingsOverview, getStandingsSection } from './screens.service';

vi.mock('server-only', () => ({}));
const reads = vi.hoisted(() =>
  Object.fromEntries(
    [
      'getFullStandings',
      'getLeagueOverview',
      'fetchAllPlayAllStats',
      'fetchDetailedCaptainStats',
      'fetchEfficiencyStats',
      'fetchHeartbreakerStats',
      'fetchHeatCheckStats',
      'fetchReliabilityStats',
      'fetchInitialSquadAnalytics',
      'fetchInitialSquadStats',
      'fetchPointsProgression',
      'fetchRoundWinners',
      'fetchStreakStats',
    ].map((name) => [name, vi.fn()])
  )
);
vi.mock('./base-standings.service', () => reads);
vi.mock('./all-play-all.service', () => reads);
vi.mock('./curiosities.service', () => reads);
vi.mock('./performance.service', () => reads);
vi.mock('./draft.service', () => reads);
vi.mock('./progression.service', () => reads);

beforeEach(() => {
  for (const read of Object.values(reads)) read.mockReset().mockResolvedValue([]);
});

it.each([
  ['progression', 'fetchPointsProgression', 50],
  ['rounds', 'fetchRoundWinners', 34],
  ['draft', 'fetchInitialSquadAnalytics', undefined],
  ['form', 'fetchHeatCheckStats', undefined],
  ['performance', 'fetchReliabilityStats', undefined],
  ['alternatives', 'fetchAllPlayAllStats', undefined],
  ['curiosities', 'fetchHeartbreakerStats', undefined],
  ['captains', 'fetchDetailedCaptainStats', undefined],
] as const)('preserves %s selection, limits and row presentation', async (section, read, limit) => {
  reads[read].mockResolvedValue(
    Array.from({ length: 25 }, (_, i) => ({ user_id: `00${i}`, name: '', points: -1234.5 }))
  );
  const result = await getStandingsSection(section);
  expect(result.rows).toHaveLength(20);
  expect(result.rows[0]).toEqual({
    key: '000',
    title: '',
    value: (-1234.5).toLocaleString('es-ES'),
    href: section === 'captains' ? '/user/000' : null,
  });
  if (limit !== undefined) expect(reads[read]).toHaveBeenCalledWith(limit);
  else expect(reads[read]).toHaveBeenCalledWith();
});

it.each([
  ['draft', 'fetchInitialSquadStats'],
  ['form', 'fetchStreakStats'],
  ['performance', 'fetchEfficiencyStats'],
] as const)('retains %s secondary read and its rejection', async (section, secondary) => {
  const error = new Error('synthetic secondary failure');
  reads[secondary].mockRejectedValue(error);
  await expect(getStandingsSection(section)).rejects.toBe(error);
});

it('preserves nullish title precedence and zero values', async () => {
  reads.fetchRoundWinners.mockResolvedValue([
    { user_id: '007', name: null, round_name: 'Jornada 2', points: 0 },
  ]);
  expect(await getStandingsSection('rounds')).toEqual({
    rows: [{ key: '007', title: 'Jornada 2', value: '0', href: null }],
  });
});

it('keeps empty and unknown sections empty without unrelated reads', async () => {
  expect(await getStandingsSection('unknown')).toEqual({ rows: [] });
  for (const read of Object.values(reads)) expect(read).not.toHaveBeenCalled();
  expect(await getStandingsSection('draft')).toEqual({ rows: [] });
});

it('overview retains both reads and their output models', async () => {
  const standings = [{ user_id: '007' }];
  const leagueTotals = { total_rounds: 2 };
  reads.getFullStandings.mockResolvedValue(standings);
  reads.getLeagueOverview.mockResolvedValue(leagueTotals);
  expect(await getStandingsOverview()).toEqual({ standings, leagueTotals });
});
