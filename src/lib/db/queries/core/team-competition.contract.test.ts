import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const dependencies = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('../../connection', () => ({ pgClient: { query: dependencies.query } }));
vi.mock('@/lib/db/client', () => ({ db: { query: dependencies.query } }));
vi.mock('../../season-context', () => ({ resolveReadSeasonId: dependencies.season }));
import {
  getTeamMatchesCount,
  getAllTeamMatchesCount,
  getAllTeamsPlayoffProbabilities,
  getTeamPlayoffProbability,
} from './teams';

beforeEach(() => {
  vi.resetAllMocks();
  dependencies.season.mockResolvedValue('fixture-season');
});

it('preserves probability rules, clamping and the sequential three-query snapshot', async () => {
  dependencies.query
    .mockResolvedValueOnce({
      rows: [
        { team_id: '1', wins: '20', position: '1' },
        { team_id: '7', wins: '10', position: '10' },
        { team_id: '8', wins: '9', position: '11' },
        { team_id: '20', wins: '2', position: '20' },
      ],
    })
    .mockResolvedValueOnce({
      rows: [
        { team_id: '1', recent_wins: '5' },
        { team_id: '7', recent_wins: '3' },
        { team_id: '8', recent_wins: '0' },
      ],
    })
    .mockResolvedValueOnce({
      rows: [
        { team_id: '7', opponent_id: '1' },
        { team_id: '8', opponent_id: '20' },
      ],
    });
  expect(await getAllTeamsPlayoffProbabilities()).toEqual({ 1: 99, 7: 50, 8: 32, 20: 1 });
  expect(dependencies.season).toHaveBeenCalledExactlyOnceWith();
  expect(dependencies.query.mock.calls.map((call) => call[1])).toEqual([
    ['fixture-season'],
    ['fixture-season'],
    ['fixture-season'],
  ]);
  expect(dependencies.query.mock.calls[0][0]).toContain('RankedStandings');
  expect(dependencies.query.mock.calls[1][0]).toContain('recent_wins');
  expect(dependencies.query.mock.calls[2][0]).toContain('opponent_id');
});

it('preserves zero/neutral invalid-ID fallbacks before any read', async () => {
  expect(await getTeamMatchesCount('7abc')).toBe(0);
  expect(await getTeamPlayoffProbability('7abc')).toBe(50);
  expect(dependencies.season).not.toHaveBeenCalled();
  expect(dependencies.query).not.toHaveBeenCalled();
});

it('preserves numeric coercion and count defaults', async () => {
  dependencies.query
    .mockResolvedValueOnce({ rows: [{ count: '4' }] })
    .mockResolvedValueOnce({ rows: [] });
  expect(await getTeamMatchesCount('007')).toBe(4);
  expect(await getTeamMatchesCount('')).toBe(0);
  expect(dependencies.query.mock.calls.map((call) => call[1])).toEqual([
    [7, 'fixture-season'],
    [0, 'fixture-season'],
  ]);
});

it('retains all-team counts and neutral probability for a missing team', async () => {
  dependencies.query.mockResolvedValueOnce({
    rows: [
      { team_id: '7', count: '4' },
      { team_id: '8', count: '0' },
    ],
  });
  expect(await getAllTeamMatchesCount()).toEqual({ 7: 4, 8: 0 });
  dependencies.query.mockResolvedValue({ rows: [] });
  expect(await getTeamPlayoffProbability(999)).toBe(50);
});

it('stops subsequent probability reads on failure', async () => {
  dependencies.query.mockRejectedValue(new Error('fixture standings failure'));
  await expect(getAllTeamsPlayoffProbabilities()).rejects.toThrow('fixture standings failure');
  expect(dependencies.query).toHaveBeenCalledTimes(1);
});
