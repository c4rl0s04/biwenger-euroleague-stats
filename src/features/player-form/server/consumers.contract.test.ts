import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/connection', () => ({ pgClient: { query: fake.query } }));
vi.mock('@/lib/db/client', () => ({ db: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
import {
  getAllPlayers,
  getTopPlayers,
  getTopPlayersByForm,
} from '../../players/server/services/player-catalogue-facts.service';
import { listTeamRoster } from '../../teams/server/services/team-roster.service';

beforeEach(() => {
  vi.resetAllMocks();
  fake.season.mockResolvedValueOnce('metadata-season').mockResolvedValue('form-season');
  fake.query.mockImplementation(async (sql: string) => ({
    rows: sql.includes('WITH RecentMatchInfo')
      ? [{ player_id: '7', recent_scores: '10,X,5', avg_recent_points: '7.5' }]
      : [
          {
            id: '7',
            average: '7.5',
            total_points: '15.9',
            games_played: '2',
            played: '2',
            price: '100.9',
            best_score: '10',
            worst_score: '5',
          },
          { id: 8, average: null },
        ],
  }));
});

it.each([
  ['catalogue', getAllPlayers, ['metadata-season']],
  ['top players', () => getTopPlayers(4), [4, 'metadata-season']],
  ['team roster', () => listTeamRoster(9), [9, 'metadata-season']],
] as const)(
  '%s preserves independent seasons, parallel reads, metadata ordering and null missing form',
  async (_name, read, params) => {
    const rows = await read();
    expect(rows.map((row) => [row.id, row.recent_scores])).toEqual([
      ['7', '10,X,5'],
      [8, null],
    ]);
    expect(fake.query.mock.calls.map((call) => call[1])).toEqual([params, [5, 'form-season']]);
    expect(fake.season).toHaveBeenCalledTimes(2);
  }
);

it('form ranking reads form before metadata, doubles the candidate limit and preserves integer/score conversion', async () => {
  const rows = await getTopPlayersByForm(1, 3);
  expect(fake.query.mock.calls.map((call) => call[1])).toEqual([
    [3, 'form-season'],
    [[7], 'metadata-season'],
  ]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    id: 7,
    avg_points: 5,
    total_points: 15,
    games_played: 2,
    recent_scores: '10,X,5',
  });
});

it('empty form skips ranking metadata but not the original independent season resolutions', async () => {
  fake.query.mockResolvedValue({ rows: [] });
  expect(await getTopPlayersByForm()).toEqual([]);
  expect(fake.query).toHaveBeenCalledTimes(1);
  expect(fake.season).toHaveBeenCalledTimes(2);
});

it.each([getAllPlayers, getTopPlayers, getTopPlayersByForm, () => listTeamRoster(9)])(
  'propagates form failure without silently dropping enrichment',
  async (read) => {
    const failure = new Error('synthetic-form-failure');
    fake.query.mockImplementation(async (sql: string) => {
      if (sql.includes('WITH RecentMatchInfo')) throw failure;
      return { rows: [] };
    });
    await expect(read()).rejects.toBe(failure);
  }
);
