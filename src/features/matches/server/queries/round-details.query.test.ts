import { beforeEach, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
vi.mock('server-only', () => ({}));
const state = vi.hoisted(() => ({ calls: [] as Array<[string, unknown[]]> }));
vi.mock('@/lib/db/client', () => {
  const chain: Record<string, unknown> = {};
  for (const name of ['select', 'from', 'where', 'groupBy', 'orderBy', 'leftJoin'])
    chain[name] = (...args: unknown[]) => {
      state.calls.push([name, args]);
      return chain;
    };
  chain.then = (resolve: (rows: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
  return { db: chain };
});
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: vi.fn() }));
import { queryRoundInfo, queryFinishedMatches, queryRoundFixtures } from './round-details.query';
const dialect = new PgDialect();
const render = (value: unknown) =>
  dialect.sqlToQuery(value as Parameters<PgDialect['sqlToQuery']>[0]);
beforeEach(() => {
  state.calls = [];
});
it('keeps grouped round projection and Number conversion against the supplied season', async () => {
  await queryRoundInfo('007', 'season-A');
  expect(Object.keys(state.calls.find(([name]) => name === 'select')![1][0] as object)).toEqual([
    'round_id',
    'round_name',
    'start_date',
    'end_date',
  ]);
  expect(render(state.calls.find(([name]) => name === 'where')![1][0]).params).toEqual([
    'season-A',
    7,
  ]);
  expect(state.calls.filter(([name]) => name === 'groupBy')).toHaveLength(1);
});
it('retains regulation scores and finished/non-null score filtering for positions', async () => {
  await queryFinishedMatches('season-A');
  expect(Object.keys(state.calls.find(([name]) => name === 'select')![1][0] as object)).toEqual([
    'home_id',
    'away_id',
    'home_score',
    'away_score',
    'home_score_regtime',
    'away_score_regtime',
    'status',
  ]);
  const where = render(state.calls.find(([name]) => name === 'where')![1][0]);
  expect(where.params).toEqual(['finished', 'season-A']);
  expect(where.sql.match(/IS NOT NULL/g)).toHaveLength(2);
});
it('keeps nullable team joins, date ordering and fixture projection', async () => {
  await queryRoundFixtures(9, 'season-A');
  expect(state.calls.filter(([name]) => name === 'leftJoin')).toHaveLength(2);
  expect(Object.keys(state.calls.find(([name]) => name === 'select')![1][0] as object)).toEqual([
    'home_id',
    'away_id',
    'home_team',
    'away_team',
    'date',
    'status',
    'home_score',
    'away_score',
    'home_logo',
    'home_short',
    'away_logo',
    'away_short',
  ]);
  expect(render(state.calls.find(([name]) => name === 'where')![1][0]).params).toEqual([
    'season-A',
    9,
  ]);
  expect(render(state.calls.find(([name]) => name === 'orderBy')![1][0]).sql).toBe(
    '"matches"."date" asc'
  );
});
