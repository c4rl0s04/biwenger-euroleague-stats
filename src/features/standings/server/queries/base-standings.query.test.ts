import { beforeEach, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ execute: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/connection', () => ({ db: { execute: mocks.execute } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));
import {
  queryFullStandings,
  querySimpleStandings,
  queryValueRanking,
  queryLeagueOverview,
} from './base-standings.query';

const dialect = new PgDialect();
function statements() {
  return mocks.execute.mock.calls.map(([statement]) => dialect.sqlToQuery(statement));
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.season.mockResolvedValue('synthetic-season');
  mocks.execute.mockResolvedValue({ rows: [] });
});

it.each([
  'position',
  'total_points',
  'avg_points',
  'round_wins',
  'team_value',
  'price_trend',
  'rounds_played',
  'best_round',
  'worst_round',
  'name',
])('preserves whitelisted sort %s and season-scoped formulas', async (sortBy) => {
  expect(await queryFullStandings({ sortBy, direction: 'asc' })).toEqual([]);
  const statement = statements()[0];
  expect(statement.sql).toContain(`ORDER BY ${sortBy} ASC NULLS LAST`);
  expect(statement.params).toEqual(Array(4).fill('synthetic-season'));
  expect(statement.sql).toContain('RANK() OVER (PARTITION BY round_id ORDER BY points DESC)');
  expect(statement.sql).toContain('COALESCE(sq.team_value, 0)::int as team_value');
  expect(statement.sql).toContain("COALESCE(us.status, 'active') = 'active'");
  expect(statement.sql.match(/participated" = TRUE/g)).toHaveLength(2);
});
it.each(['', 'unknown', 'name DESC; DROP TABLE users'])(
  'retains ordinary unknown sort fallback: %s',
  async (sortBy) => {
    await queryFullStandings({ sortBy });
    expect(statements()[0].sql).toContain('ORDER BY total_points DESC NULLS LAST');
    expect(statements()[0].params).toEqual(Array(4).fill('synthetic-season'));
  }
);
it.each(['toString', 'constructor'])(
  'preserves legacy inherited-key binding quirk without SQL interpolation: %s',
  async (sortBy) => {
    await queryFullStandings({ sortBy });
    const statement = statements()[0];
    expect(statement.sql).toContain('ORDER BY $5 DESC NULLS LAST');
    expect(statement.params[4]).toBe(({} as Record<string, unknown>)[sortBy]);
  }
);
it('preserves the legacy __proto__ SQL-construction error rather than silently accepting it', async () => {
  await expect(queryFullStandings({ sortBy: '__proto__' })).rejects.toBeInstanceOf(TypeError);
  expect(mocks.execute).not.toHaveBeenCalled();
});
it('resolves season before each uncached query and stops on season failure', async () => {
  await querySimpleStandings();
  await querySimpleStandings();
  expect(mocks.season.mock.calls).toEqual([[], []]);
  expect(mocks.season.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.execute.mock.invocationCallOrder[0]
  );
  const failure = new Error('unknown synthetic season');
  mocks.season.mockRejectedValue(failure);
  await expect(queryValueRanking()).rejects.toBe(failure);
  expect(mocks.execute).toHaveBeenCalledTimes(2);
});
it('retains simple and value rankings distinct bigint/ordering projections', async () => {
  await querySimpleStandings();
  await queryValueRanking();
  expect(statements()[0].sql).toContain('COALESCE(sq.team_value, 0)::bigint as team_value');
  expect(statements()[0].sql).toContain('ORDER BY position ASC');
  expect(statements()[1].sql).toContain('COALESCE(SUM(ps.price), 0)::bigint as team_value');
  expect(statements()[1].sql).toContain('ORDER BY team_value DESC');
  expect(statements()[1].params).toEqual(['synthetic-season']);
});
it('preserves sequential league reads, completed-round formulas, and optional streak failure', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const pointsStats = { total_points: null, total_rounds: 0, total_users: 0 };
  const valueStats = { total_league_value: null, max_team_value: null, min_team_value: null };
  mocks.execute
    .mockResolvedValueOnce({ rows: [pointsStats] })
    .mockResolvedValueOnce({ rows: [valueStats] })
    .mockResolvedValueOnce({ rows: [{ total_season_rounds: 0 }] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] })
    .mockRejectedValueOnce(new Error('synthetic streak failure'));
  expect(await queryLeagueOverview()).toEqual({
    pointsStats,
    valueStats,
    seasonRounds: { total_season_rounds: 0 },
    mostValuable: undefined,
    roundRecord: undefined,
    leaderStreak: { streak: 0 },
  });
  expect(mocks.season).toHaveBeenCalledTimes(1);
  expect(mocks.execute).toHaveBeenCalledTimes(6);
  expect(statements()[0].sql).toContain(
    "HAVING COUNT(*) = COUNT(CASE WHEN status = 'finished' THEN 1 END)"
  );
  expect(statements()[4].sql).not.toContain('participated = TRUE');
  expect(statements()[5].sql).toContain('WHERE participated = TRUE');
  error.mockRestore();
});
