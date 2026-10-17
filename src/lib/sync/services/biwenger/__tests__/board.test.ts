import { describe, expect, it, vi } from 'vitest';
import { syncBiwengerBoard } from '../board';

describe('Biwenger Board Service', () => {
  it('throws when seasonId is not resolved', async () => {
    const manager: any = {
      context: { db: {} },
    };
    await expect(syncBiwengerBoard(manager)).rejects.toThrow(
      'Canonical sync season was not resolved before board ingestion.'
    );
  });

  it('processes board batches including bonuses, porras, and transfers', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ name: 'June', status: 'active' }]),
        }),
      }),
      query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 }),
    };

    const manager: any = {
      context: { db: mockDb, seasonId: '2025-26' },
      mode: 'bootstrap',
      log: vi.fn(),
      resolveRoundId: vi.fn((r) => r.id),
      getBiwengerCompetition: vi.fn().mockResolvedValue({
        players: { 101: { id: 101, name: 'Campazzo' } },
        teams: { 1: { name: 'Real Madrid' } },
        rounds: [{ id: 1, name: 'Jornada 1' }],
      }),
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            type: 'roundFinished',
            date: 1759685765,
            content: {
              round: { id: 1, name: 'Jornada 1' },
              results: [{ user: { id: 10 }, bonus: 500000 }],
            },
          },
          {
            type: 'adminTransfer',
            date: 1759685765,
            content: {
              to: { id: 10 },
              amount: 250000,
              text: 'Admin Bonus',
            },
          },
          {
            type: 'bettingPool',
            date: 1759685765,
            content: {
              pool: {
                round: { id: 1, name: 'Jornada 1' },
                responses: [{ id: 10, response: [80, 75], hits: 1 }],
              },
            },
          },
          {
            type: 'transfer',
            date: 1759685765,
            content: [
              {
                player: 101,
                amount: 1000000,
                from: { name: 'June' },
                to: null,
                bids: [{ user: { id: 10, name: 'June' }, amount: 1000000 }],
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] });

    const result = await syncBiwengerBoard(manager, {
      fetch: mockFetch,
      leagueId: 'test-league-1',
    });

    expect(result.summary).toContain('Biwenger board history synchronized');
    expect(result.counts.finances).toBe(2); // 1 round bonus + 1 admin bonus
    expect(result.counts.pools).toBe(1);
    expect(result.counts.transfers).toBe(1);
  });

  it('records a loan fee for both managers and ignores the player return', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { name: 'Lender', status: 'active' },
            { name: 'Borrower', status: 'active' },
          ]),
        }),
      }),
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    };
    const manager: any = {
      context: { db: mockDb, seasonId: '2026-27' },
      mode: 'bootstrap',
      log: vi.fn(),
      getBiwengerCompetition: vi.fn().mockResolvedValue({ players: {}, teams: {} }),
    };
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            type: 'loan',
            date: 1791396115,
            content: [
              {
                player: 101,
                from: { id: 10, name: 'Lender' },
                to: { id: 20, name: 'Borrower' },
                amount: 500000,
                rounds: 2,
              },
              { player: 102, from: { id: 10 }, to: null, amount: 500000 },
            ],
          },
          {
            type: 'loanReturn',
            date: 1792025423,
            content: [
              {
                player: 101,
                from: { id: 20, name: 'Borrower' },
                to: { id: 10, name: 'Lender' },
                rounds: 2,
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] });

    const result = await syncBiwengerBoard(manager, {
      fetch: mockFetch,
      leagueId: 'test-league-1',
    });
    const financeCalls = mockDb.query.mock.calls.filter(([sql]) =>
      String(sql).includes('INSERT INTO finances')
    );

    expect(result.counts.finances).toBe(2);
    expect(financeCalls.map(([, params]) => [params[1], params[4], params[5]])).toEqual([
      ['10', 'loan_fee', 500000],
      ['20', 'loan_fee', -500000],
    ]);
  });
});
