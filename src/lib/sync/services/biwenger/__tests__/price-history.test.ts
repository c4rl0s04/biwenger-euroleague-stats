import { describe, expect, it, vi } from 'vitest';
import type { SyncManager } from '../../../manager';
import { priceHistoryBoundsKey } from '../../../price-history';
import type { PriceHistoryPlayer } from '../../../repositories/price-history';
import { syncBiwengerPriceHistory } from '../price-history';

const bounds = { startsAt: '2026-09-01', endsAt: null };
const now = new Date('2026-09-27T12:00:00Z');
const player = (playerId: number): PriceHistoryPlayer => ({
  playerId,
  checkedAt: null,
  checkpointBounds: null,
});
function fixture(players = [player(7), player(8)]) {
  const repository = {
    invalidateCheckpoints: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue({ bounds, players }),
    reconcile: vi.fn().mockResolvedValue({ inserted: 1, corrected: 1, unchanged: 0 }),
  };
  const fetchHistory = vi.fn(async (id: number) => ({
    data: {
      id,
      prices: [
        [260924, 1740000],
        [260925, 1850000],
      ],
    },
  }));
  const manager = {
    context: { db: {}, seasonId: '2026-27' },
    mode: 'routine',
    log: vi.fn(),
    warn: vi.fn(),
  } as unknown as SyncManager;
  return { manager, repository, fetchHistory, now: () => now };
}

describe('price history orchestration', () => {
  it('fetches every due season player independently of catalogue presence or global identity', async () => {
    const f = fixture();
    const result = await syncBiwengerPriceHistory(f.manager, f);
    expect(f.fetchHistory.mock.calls.map(([id]) => id)).toEqual([7, 8]);
    expect(f.repository.reconcile).toHaveBeenCalledWith(
      '2026-27',
      7,
      [
        { date: '2026-09-24', price: 1740000 },
        { date: '2026-09-25', price: 1850000 },
      ],
      bounds,
      now.toISOString()
    );
    expect(result.counts).toMatchObject({ inserted: 2, corrected: 2, fetched: 2, failed: 0 });
  });
  it('skips fresh players in routine mode but bootstrap forces full reconciliation', async () => {
    const f = fixture([
      {
        ...player(7),
        checkedAt: now.toISOString(),
        checkpointBounds: priceHistoryBoundsKey(bounds),
      },
    ]);
    expect((await syncBiwengerPriceHistory(f.manager, f)).counts).toMatchObject({
      skipped: 1,
      fetched: 0,
    });
    expect(f.fetchHistory).not.toHaveBeenCalled();
    const bootstrap = { ...f.manager, mode: 'bootstrap' } as SyncManager;
    await syncBiwengerPriceHistory(bootstrap, f);
    expect(f.fetchHistory).toHaveBeenCalledOnce();
  });
  it('fails visibly without persisting an invalid response, while retaining other successful players', async () => {
    const f = fixture();
    f.fetchHistory.mockRejectedValueOnce(new Error('private provider payload'));
    await expect(syncBiwengerPriceHistory(f.manager, f)).rejects.toThrow('failed for 1');
    expect(f.repository.reconcile).toHaveBeenCalledTimes(1);
    expect(f.manager.warn).toHaveBeenCalledWith(
      'Price history failed for player 7; retry remains due.'
    );
    await syncBiwengerPriceHistory(f.manager, f);
    expect(f.fetchHistory).toHaveBeenCalledTimes(4);
  });
  it('never persists malformed provider history', async () => {
    const f = fixture([player(7)]);
    f.fetchHistory.mockResolvedValue({ data: { id: 7, prices: [[260231, 1]] } });
    await expect(syncBiwengerPriceHistory(f.manager, f)).rejects.toThrow('failed for 1');
    expect(f.repository.reconcile).not.toHaveBeenCalled();
  });
  it('resumes only failed players using successful persisted checkpoints', async () => {
    const f = fixture();
    const players = [player(7), player(8)];
    f.repository.load.mockImplementation(async () => ({ bounds, players }));
    f.repository.reconcile.mockImplementation(async (_season, id) => {
      const p = players.find((candidate) => candidate.playerId === id)!;
      p.checkedAt = now.toISOString();
      p.checkpointBounds = priceHistoryBoundsKey(bounds);
      return { inserted: 0, corrected: 0, unchanged: 2 };
    });
    f.fetchHistory.mockRejectedValueOnce(new Error('temporary failure'));
    await expect(syncBiwengerPriceHistory(f.manager, f)).rejects.toThrow();
    f.fetchHistory.mockClear();
    expect((await syncBiwengerPriceHistory(f.manager, f)).counts).toMatchObject({
      fetched: 1,
      skipped: 1,
    });
    expect(f.fetchHistory).toHaveBeenCalledExactlyOnceWith(7);
  });

  it('leaves failed forced refreshes due for routine retry despite previously fresh checkpoints', async () => {
    const current = {
      ...player(7),
      checkedAt: now.toISOString(),
      checkpointBounds: priceHistoryBoundsKey(bounds),
    };
    const f = fixture([current]);
    f.repository.invalidateCheckpoints.mockImplementation(async () => {
      current.checkedAt = '';
    });
    f.fetchHistory.mockRejectedValueOnce(new Error('temporary failure'));
    await expect(
      syncBiwengerPriceHistory({ ...f.manager, mode: 'bootstrap' } as SyncManager, f)
    ).rejects.toThrow();
    expect(f.repository.invalidateCheckpoints).toHaveBeenCalledExactlyOnceWith('2026-27', [7]);
    expect(f.repository.reconcile).not.toHaveBeenCalled();
    await syncBiwengerPriceHistory(f.manager, f);
    expect(f.fetchHistory).toHaveBeenCalledTimes(2);
    expect(f.repository.reconcile).toHaveBeenCalledOnce();
  });

  it('treats persistence failure as a failed sync rather than a successful fetch', async () => {
    const f = fixture([player(7)]);
    f.repository.reconcile.mockRejectedValueOnce(new Error('write failed'));
    await expect(syncBiwengerPriceHistory(f.manager, f)).rejects.toThrow('failed for 1');
    expect(f.manager.log).toHaveBeenCalledWith(expect.stringContaining('"fetched":0'));
  });
  it('accepts an explicitly empty history and reports it separately', async () => {
    const f = fixture([player(7)]);
    f.fetchHistory.mockResolvedValue({ data: { id: 7, prices: [] } });
    f.repository.reconcile.mockResolvedValue({ inserted: 0, corrected: 0, unchanged: 0 });
    expect((await syncBiwengerPriceHistory(f.manager, f)).counts).toMatchObject({
      empty: 1,
      failed: 0,
    });
  });
  it('limits in-flight requests to two, even for a full season', async () => {
    const f = fixture(Array.from({ length: 335 }, (_, i) => player(i + 1)));
    let active = 0;
    let peak = 0;
    f.fetchHistory.mockImplementation(async (id) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setImmediate(resolve));
      active--;
      return { data: { id, prices: [] } };
    });
    await syncBiwengerPriceHistory(f.manager, f);
    expect(f.fetchHistory).toHaveBeenCalledTimes(335);
    expect(peak).toBe(2);
  });
  it('bounds a 335-player cold refresh to 14 simulated minutes of maximum provider pacing', async () => {
    vi.useFakeTimers();
    try {
      const f = fixture(Array.from({ length: 335 }, (_, i) => player(i + 1)));
      f.fetchHistory.mockImplementation(async (id) => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return { data: { id, prices: [] } };
      });
      const startedAt = Date.now();
      const run = syncBiwengerPriceHistory(f.manager, f);
      await vi.runAllTimersAsync();
      await run;
      expect(Date.now() - startedAt).toBe(840000);
    } finally {
      vi.useRealTimers();
    }
  });
});
