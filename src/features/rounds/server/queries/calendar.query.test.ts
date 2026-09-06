import { expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
vi.mock('server-only', () => ({}));
const chain = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}));
vi.mock('@/lib/db/connection', () => ({ db: chain }));
import { listCalendarRows } from './calendar.query';

it('selects only the five chronology fields with season filtering and stable date/id ordering', async () => {
  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockResolvedValue([]);
  expect(await listCalendarRows('2025-2026')).toEqual([]);
  expect(Object.keys(chain.select.mock.calls[0][0])).toEqual([
    'id',
    'date',
    'status',
    'roundId',
    'roundName',
  ]);
  expect(getTableName(chain.from.mock.calls[0][0])).toBe('matches');
  const dialect = new PgDialect();
  expect(dialect.sqlToQuery(chain.where.mock.calls[0][0])).toMatchObject({
    sql: '"matches"."season_id" = $1',
    params: ['2025-2026'],
  });
  expect(chain.orderBy.mock.calls[0].map((value) => dialect.sqlToQuery(value).sql)).toEqual([
    '"matches"."date" asc',
    '"matches"."id" asc',
  ]);
});
