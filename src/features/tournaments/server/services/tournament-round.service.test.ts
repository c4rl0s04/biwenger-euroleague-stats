import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/features/rounds/server', () => ({ resolveRoundIdByPolicy: vi.fn() }));
import { createTournamentRoundService } from './tournament-round.service';

describe('Tournament desktop round selection', () => {
  it('uses the Rounds policy on every active request, including an empty fixture list', async () => {
    const resolve = vi.fn().mockResolvedValueOnce(7).mockResolvedValueOnce(null);
    const read = createTournamentRoundService(resolve);
    expect(await read({ status: 'active' }, [{ round_id: 100 }])).toBe(7);
    expect(await read({ status: 'active' }, [])).toBeNull();
    expect(resolve.mock.calls).toEqual([['active_or_next'], ['active_or_next']]);
  });
  it('uses the greatest fixture round ID for finished tournaments without mutating the list', async () => {
    const resolve = vi.fn();
    const fixtures = [{ round_id: 2 }, { round_id: null }, { round_id: 9 }, { round_id: 1 }];
    expect(await createTournamentRoundService(resolve)({ status: 'finished' }, fixtures)).toBe(9);
    expect(fixtures.map((fixture) => fixture.round_id)).toEqual([2, null, 9, 1]);
    expect(resolve).not.toHaveBeenCalled();
  });
  it('preserves empty lists and stable zero/null ties for other statuses', async () => {
    const read = createTournamentRoundService(vi.fn());
    expect(await read({ status: null }, [])).toBeNull();
    expect(await read({ status: 'unknown' }, [{ round_id: null }, { round_id: 0 }])).toBeNull();
    expect(await read({ status: 'unknown' }, [{ round_id: 0 }, { round_id: null }])).toBe(0);
  });
  it('propagates calendar failures', async () => {
    const error = new Error('synthetic calendar failure');
    await expect(
      createTournamentRoundService(vi.fn().mockRejectedValue(error))({ status: 'active' }, [])
    ).rejects.toBe(error);
  });
});
