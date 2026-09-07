import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/connection', () => ({ pgClient: { query: mocks.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: mocks.season }));

import * as legacyQueries from '@/lib/db/queries/tournaments';
import * as legacyService from '@/lib/services/tournamentService';
import * as tournaments from '../server';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.mockReset().mockResolvedValue({ rows: [] });
  mocks.season.mockReset().mockResolvedValue('2026-27');
});

describe('Tournaments full service/query legacy contract', () => {
  it('keeps every old name as an adapter to one implementation', () => {
    for (const name of [
      'getTournaments',
      'getTournamentById',
      'getTournamentStandings',
      'getTournamentFixtures',
      'getUserTournaments',
    ] as const)
      expect(legacyQueries[name]).toBe(tournaments[name]);
    for (const name of [
      'getAllTournaments',
      'getStandings',
      'getFixtures',
      'fetchUserTournaments',
    ] as const)
      expect(legacyService[name]).toBe(tournaments[name]);
  });
  it('keeps runtime null names through the historical screen typing adapter', async () => {
    mocks.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: null, type: null, status: null, data_json: null }],
    });
    expect(await legacyService.getTournamentDetails('1')).toEqual({
      id: 1,
      name: null,
      type: null,
      status: null,
      data_json: null,
      data: null,
    });
  });
  it('categorizes active/other statuses without sorting or dropping the document', async () => {
    const rows = [
      { id: 2, name: 'B', type: 'league', status: 'finished', data_json: 'null' },
      { id: 1, name: 'A', type: 'playoff', status: 'active', data_json: '{"arbitrary":[1,2]}' },
      { id: 3, name: null, type: null, status: null, data_json: null },
    ];
    mocks.query.mockResolvedValueOnce({ rows });
    const data = await legacyService.getAllTournaments();
    expect(data.all.map((t) => t.id)).toEqual([2, 1, 3]);
    expect(data.active.map((t) => t.id)).toEqual([1]);
    expect(data.finished.map((t) => t.id)).toEqual([2, 3]);
    expect(data.active[0].data).toEqual({ arbitrary: [1, 2] });
    expect(mocks.query.mock.calls[0][0]).toContain(
      "CASE WHEN t.status = 'active' THEN 1 ELSE 2 END"
    );
    expect(mocks.query.mock.calls[0][0]).toContain('t.updated_at DESC');
    expect(mocks.query.mock.calls[0][1]).toEqual(['2026-27']);
  });
  it('returns null for missing detail and preserves Number coercion without new strict ID validation', async () => {
    for (const id of ['7', '7abc', '', ' ', '0x10', '1e2', 0]) {
      expect(await legacyService.getTournamentDetails(id)).toBeNull();
      expect(mocks.query.mock.lastCall?.[1]).toEqual([Number(id), '2026-27']);
      await legacyService.getStandings(id);
      expect(mocks.query.mock.lastCall?.[1]).toEqual([Number(id), '2026-27']);
    }
  });
  it('preserves fixture truthiness and all-tournament reads', async () => {
    for (const id of [null, 0, '0', '', '7abc', '07']) {
      expect(await legacyService.getFixtures(id)).toEqual([]);
      expect(mocks.query.mock.lastCall?.[1]).toEqual([id ? Number(id) : null, '2026-27']);
      expect(mocks.query.mock.lastCall?.[0]).toContain('ORDER BY tf.date ASC');
      expect(mocks.query.mock.lastCall?.[0]).toContain(
        '($1::int IS NULL OR tf.tournament_id = $1)'
      );
    }
    await legacyQueries.getTournamentStandings(null);
    expect(mocks.query.mock.lastCall?.[1]).toEqual([null, '2026-27']);
    expect(mocks.query.mock.lastCall?.[0]).toContain('ts.*');
    expect(mocks.query.mock.lastCall?.[0]).toContain('ORDER BY ts.position ASC');
  });
  it('retains substring membership, UNION ALL, string IDs, order and duplicate rows', async () => {
    const row = {
      tournament_id: 1,
      tournament_name: 'Cup',
      tournament_type: 'league',
      tournament_status: 'active',
      data_json: null,
      position: 0,
      points: '0',
      won: '2',
      drawn: null,
      lost: 0,
      phase_name: null,
      group_name: null,
    };
    mocks.query.mockResolvedValueOnce({ rows: [row, row] });
    const results = await legacyService.fetchUserTournaments('07');
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ position: null, points: 0, won: 2, drawn: 0, lost: 0 });
    expect(results[0]).not.toHaveProperty('data_json');
    const [sql, params] = mocks.query.mock.calls[0];
    expect(params).toEqual(['07', '2026-27']);
    expect(sql).toContain("t.data_json::text LIKE '%' || $1::text || '%'");
    expect(sql).toContain('UNION ALL');
    expect(sql).toContain('ORDER BY tournament_id DESC');
  });
  it.each([
    'getTournaments',
    'getTournamentById',
    'getTournamentStandings',
    'getTournamentFixtures',
    'getUserTournaments',
  ] as const)(
    '%s resolves season on every call, does not cache and propagates errors',
    async (name) => {
      const failure = new Error('synthetic database failure');
      await legacyQueries[name](7);
      mocks.query.mockRejectedValueOnce(failure);
      await expect(legacyQueries[name](7)).rejects.toBe(failure);
      expect(mocks.season).toHaveBeenCalledTimes(2);
      expect(mocks.season).toHaveBeenCalledWith();
      expect(mocks.query).toHaveBeenCalledTimes(2);
      mocks.season.mockRejectedValueOnce(failure);
      await expect(legacyQueries[name](7)).rejects.toBe(failure);
      expect(mocks.query).toHaveBeenCalledTimes(2);
    }
  );
  it('preserves the different malformed-JSON outcomes for detail/list and participation', async () => {
    const row = { id: 1, name: 'Cup', type: 'playoff', status: 'active', data_json: '{' };
    mocks.query.mockResolvedValue({ rows: [row] });
    await expect(legacyQueries.getTournaments()).rejects.toBeInstanceOf(SyntaxError);
    await expect(legacyQueries.getTournamentById(1)).rejects.toBeInstanceOf(SyntaxError);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.query.mockResolvedValueOnce({
      rows: [
        {
          tournament_id: 1,
          tournament_name: 'Cup',
          tournament_type: 'playoff',
          tournament_status: 'active',
          data_json: '{',
          position: null,
          points: null,
          won: 1,
          drawn: 0,
          lost: 0,
          phase_name: null,
          group_name: null,
        },
      ],
    });
    expect(await legacyService.fetchUserTournaments(7)).toMatchObject([
      { won: 0, drawn: 0, lost: 0, phase_name: 'Desconocida' },
    ]);
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});
