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

  it('refuses to fetch history without a canonical season start date', async () => {
    const fetch = vi.fn();
    const manager: any = {
      context: {
        seasonId: '2026-27',
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
          }),
        },
      },
    };

    await expect(syncBiwengerBoard(manager, { fetch })).rejects.toThrow(
      'Board history requires a valid canonical season start date.'
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('processes board batches including bonuses, porras, and transfers', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockResolvedValue([{ name: 'June', status: 'active', startsAt: '2025-09-01' }]),
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
    const insertedFinances = new Set<string>();
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { name: 'Lender', status: 'active', startsAt: '2026-09-01' },
            { name: 'Borrower', status: 'active' },
          ]),
        }),
      }),
      query: vi.fn().mockImplementation(async (sql: string, params: unknown[]) => {
        if (!sql.includes('INSERT INTO finances')) return { rows: [], rowCount: 1 };
        const key = JSON.stringify(params);
        if (insertedFinances.has(key)) return { rows: [], rowCount: 0 };
        insertedFinances.add(key);
        return { rows: [], rowCount: 1 };
      }),
    };
    const manager: any = {
      context: { db: mockDb, seasonId: '2026-27' },
      mode: 'bootstrap',
      log: vi.fn(),
      getBiwengerCompetition: vi.fn().mockResolvedValue({ players: {}, teams: {} }),
    };
    const mockFetch = vi.fn().mockResolvedValue({
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
            { player: 102, from: { id: 10 }, to: null, amount: 0 },
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
        {
          type: 'loan',
          date: 1759685765,
          content: [{ player: 103, from: { id: 10 }, to: { id: 20 }, amount: 300000 }],
        },
      ],
    });

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

    const repeated = await syncBiwengerBoard(manager, {
      fetch: mockFetch,
      leagueId: 'test-league-1',
    });
    expect(repeated.counts.finances).toBe(0);
  });

  it.each([null, [{ player: 101, from: { id: 10 }, amount: 500000 }]])(
    'fails on malformed paid loan content: %j',
    async (content) => {
      const manager: any = {
        context: {
          db: {
            select: vi.fn().mockReturnValue({
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ startsAt: '2026-09-01' }]),
              }),
            }),
            query: vi.fn(),
          },
          seasonId: '2026-27',
        },
        mode: 'bootstrap',
        log: vi.fn(),
        getBiwengerCompetition: vi.fn().mockResolvedValue({ players: {}, teams: {} }),
      };

      await expect(
        syncBiwengerBoard(manager, {
          fetch: vi.fn().mockResolvedValue({
            data: [
              {
                type: 'loan',
                date: 1791396115,
                content,
              },
            ],
          }),
          leagueId: 'test-league-1',
        })
      ).rejects.toThrow(/Invalid loan (board content|fee)/);
    }
  );

  it('propagates a finance write failure', async () => {
    const manager: any = {
      context: {
        db: {
          select: vi.fn().mockReturnValue({
            from: vi
              .fn()
              .mockReturnValue({ where: vi.fn().mockResolvedValue([{ startsAt: '2026-09-01' }]) }),
          }),
          query: vi.fn().mockRejectedValue(new Error('database write failed')),
        },
        seasonId: '2026-27',
      },
      mode: 'bootstrap',
      log: vi.fn(),
      getBiwengerCompetition: vi.fn().mockResolvedValue({ players: {}, teams: {} }),
    };

    await expect(
      syncBiwengerBoard(manager, {
        fetch: vi.fn().mockResolvedValue({
          data: [
            {
              type: 'roundFinished',
              date: 1791396115,
              content: { results: [{ user: { id: 10 }, bonus: 500000 }] },
            },
          ],
        }),
        leagueId: 'test-league-1',
      })
    ).rejects.toThrow('database write failed');
  });
});
