import { beforeEach, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
vi.mock('server-only', () => ({}));
const state = vi.hoisted(() => ({
  rows: [] as unknown[],
  calls: [] as Array<[string, unknown[]]>,
  season: vi.fn(),
  pg: vi.fn(),
}));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: state.season }));
vi.mock('@/lib/db/client', () => {
  const chain: Record<string, unknown> = {};
  for (const name of [
    'select',
    'from',
    'where',
    'groupBy',
    'having',
    'orderBy',
    'limit',
    'innerJoin',
    'leftJoin',
  ])
    chain[name] = (...args: unknown[]) => {
      state.calls.push([name, args]);
      return chain;
    };
  chain.then = (resolve: (rows: unknown) => unknown) =>
    Promise.resolve(state.rows.shift()).then(resolve);
  return { db: chain, pgClient: { query: state.pg } };
});
import { queryLastRoundMVPs, queryLastRoundStats } from './last-round.query';
import { queryHighestRoundSnapshot } from './highest-round.query';
const dialect = new PgDialect();
const rendered = (value: unknown) =>
  dialect.sqlToQuery(value as Parameters<PgDialect['sqlToQuery']>[0]);
beforeEach(() => {
  state.rows = [];
  state.calls = [];
  state.season.mockReset().mockResolvedValue('season-A');
  state.pg.mockReset();
});

it.each([queryLastRoundMVPs, queryLastRoundStats])(
  'retains empty-round short circuit and completed-match selector',
  async (read) => {
    state.rows = [[]];
    expect(await read()).toEqual([]);
    expect(state.season).toHaveBeenCalledTimes(1);
    expect(state.calls.filter(([name]) => name === 'select')).toHaveLength(1);
    expect(rendered(state.calls.find(([name]) => name === 'having')![1][0]).sql).toContain(
      'COUNT(*) = SUM(CASE WHEN "matches"."status" = \'finished\' THEN 1 ELSE 0 END)'
    );
    expect(rendered(state.calls.find(([name]) => name === 'where')![1][0]).params).toEqual([
      'season-A',
    ]);
  }
);
it('keeps MVP projection, point ordering, limit and round/season parameters', async () => {
  state.rows = [[{ last_round_id: 9 }], [{ player_id: 7 }]];
  expect(await queryLastRoundMVPs(3)).toEqual([{ player_id: 7 }]);
  const selects = state.calls.filter(([name]) => name === 'select');
  expect(Object.keys(selects[1][1][0] as object)).toEqual([
    'player_id',
    'name',
    'team',
    'position',
    'points',
    'owner_name',
    'owner_color_index',
  ]);
  expect(state.calls.filter(([name]) => name === 'limit').map(([, args]) => args)).toEqual([
    [1],
    [3],
  ]);
  const where = state.calls.filter(([name]) => name === 'where').at(-1)!;
  expect(rendered(where[1][0]).params).toEqual([9, 'season-A']);
  expect(rendered(state.calls.filter(([name]) => name === 'orderBy').at(-1)![1][0]).sql).toContain(
    'fantasy_points" desc'
  );
});
it('keeps all last-round players and the existing first-match round-name subquery', async () => {
  state.rows = [[{ last_round_id: 9 }], []];
  await queryLastRoundStats();
  const projection = state.calls.filter(([name]) => name === 'select')[1][1][0] as Record<
    string,
    unknown
  >;
  expect(Object.keys(projection)).toEqual([
    'player_id',
    'name',
    'team',
    'position',
    'price',
    'points',
    'owner_name',
    'round_name',
  ]);
  expect(rendered(projection.round_name).sql).toContain('LIMIT 1');
  expect(rendered(projection.round_name).params).toEqual(['season-A']);
  expect(state.calls.filter(([name]) => name === 'limit')).toHaveLength(1);
});
it('keeps record season binding, participated filter and one-row descending points', async () => {
  state.pg.mockResolvedValue({ rows: [] });
  expect(await queryHighestRoundSnapshot()).toEqual({ seasonId: 'season-A', record: null });
  const [query, params] = state.pg.mock.calls[0];
  expect(params).toEqual(['season-A']);
  expect(query).toContain('ur.participated = TRUE');
  expect(query).toContain('ORDER BY ur.points DESC');
  expect(query).toContain('LIMIT 1');
});
