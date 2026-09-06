import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('../queries/search.query', () => ({ findSearchRecords: vi.fn() }));

import {
  createSearchService,
  SEARCH_ACCESS_POLICY,
  SEARCH_HTTP_CACHE_SECONDS,
} from './search.service';

describe('search orchestration', () => {
  it('skips persistence for short input and returns fresh empty collections', async () => {
    const findRecords = vi.fn();
    const search = createSearchService({ findRecords });
    const result = await search(' a ');
    expect(result).toEqual({ players: [], teams: [], users: [] });
    expect(findRecords).not.toHaveBeenCalled();
    expect(result.players).not.toBe((await search(null)).players);
  });

  it('trims once at the boundary and preserves the default and explicit per-category limit', async () => {
    const findRecords = vi.fn().mockResolvedValue({ players: [], teams: [], users: [] });
    const search = createSearchService({ findRecords });
    await search(' ab ');
    await search('ab', 0);
    await search('%_', 12);
    expect(findRecords.mock.calls).toEqual([
      ['ab', 5],
      ['ab', 0],
      ['%_', 12],
    ]);
  });

  it('rereads on every request and propagates database errors without translation', async () => {
    const failure = new Error('synthetic query failure');
    const findRecords = vi
      .fn()
      .mockResolvedValueOnce({ players: [], teams: [], users: [] })
      .mockRejectedValueOnce(failure);
    const search = createSearchService({ findRecords });
    await search('ab');
    await expect(search('ab')).rejects.toBe(failure);
    expect(findRecords).toHaveBeenCalledTimes(2);
    expect(SEARCH_ACCESS_POLICY).toEqual({
      read: 'public fantasy directory',
      identity: 'none',
      serverCache: 'none',
    });
    expect(SEARCH_HTTP_CACHE_SECONDS).toBe(60);
  });
});
