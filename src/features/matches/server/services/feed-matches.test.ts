import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { PgDialect } from 'drizzle-orm/pg-core';
const fake = vi.hoisted(() => ({ select: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ db: { select: fake.select } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
import {
  getUpcomingFeedMatches,
  getRecentFeedResults,
  FEED_MATCHES_POLICY,
} from './feed-matches.service';
import { mapFeedMatch, mapFeedResult } from '../mappers/feed-matches.mapper';

describe('Matches feed contract', () => {
  const chain = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    fake.season.mockResolvedValue('season-fixture');
    fake.select.mockReturnValue(chain);
    for (const method of ['from', 'innerJoin', 'where', 'orderBy'] as const)
      chain[method].mockReturnValue(chain);
    chain.limit.mockResolvedValue([]);
  });
  it.each([getUpcomingFeedMatches, getRecentFeedResults])(
    'keeps season scope, joins, defaults and no server cache',
    async (service) => {
      expect(await service()).toEqual([]);
      expect(chain.limit).toHaveBeenCalledWith(5);
      expect(chain.innerJoin).toHaveBeenCalledTimes(2);
      const predicate = new PgDialect().sqlToQuery(chain.where.mock.calls[0][0]);
      expect(predicate.params).toContain('season-fixture');
      expect(predicate.sql).toContain('season_id');
      await service(3);
      expect(chain.limit).toHaveBeenLastCalledWith(3);
      expect(fake.season).toHaveBeenCalledTimes(2);
      expect(FEED_MATCHES_POLICY.serverCache).toBe('none');
    }
  );
  it('preserves upcoming date > NOW rather than a status filter', async () => {
    await getUpcomingFeedMatches(3);
    const predicate = new PgDialect().sqlToQuery(chain.where.mock.calls[0][0]);
    expect(predicate.sql).toContain('> NOW()');
    expect(predicate.sql).not.toContain('status');
    expect(chain.orderBy.mock.calls[0][0].name).toBe('date');
  });
  it('preserves finished-only results and descending dates', async () => {
    await getRecentFeedResults(3);
    const dialect = new PgDialect();
    expect(dialect.sqlToQuery(chain.where.mock.calls[0][0]).params).toContain('finished');
    expect(dialect.sqlToQuery(chain.orderBy.mock.calls[0][0]).sql).toContain('desc');
  });
  it('maps database rows to explicit serializable records', async () => {
    const row = {
      id: 7,
      date: new Date('2026-01-01Z'),
      home_team: 'Home',
      away_team: 'Away',
      home_score: null,
      away_score: 70,
      unused: 'not exposed',
    };
    chain.limit.mockResolvedValue([row]);
    const result = await getRecentFeedResults(3);
    expect(result).toEqual([
      {
        id: 7,
        date: row.date.toISOString(),
        homeTeam: 'Home',
        awayTeam: 'Away',
        homeScore: null,
        awayScore: 70,
      },
    ]);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(mapFeedMatch({ ...row, date: null }).date).toBeNull();
    expect(mapFeedResult({ ...row, date: '2026-01-01' }).date).toBe('2026-01-01');
  });
  it('propagates read failures for News to isolate per source', async () => {
    chain.limit.mockRejectedValue(new Error('Synthetic read failure'));
    await expect(getRecentFeedResults()).rejects.toThrow('Synthetic read failure');
  });
});
