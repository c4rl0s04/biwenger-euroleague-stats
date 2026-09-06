import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: vi.fn() }));
vi.mock('../queries/calendar.query', () => ({ listCalendarRows: vi.fn() }));
import { createCalendarService, ROUND_CALENDAR_POLICY } from './calendar.service';

const row = {
  id: 1,
  roundId: 7,
  roundName: 'Round 7',
  status: 'finished',
  date: new Date('2026-01-01'),
};
function setup() {
  const calls: string[] = [];
  const deps = {
    resolveSeason: vi.fn(async () => {
      calls.push('season');
      return '2025-2026';
    }),
    now: vi.fn(() => {
      calls.push('clock');
      return new Date('2026-01-10');
    }),
    listRows: vi.fn(async (_season: string) => {
      calls.push('query');
      return [row];
    }),
  };
  return { deps, calls, service: createCalendarService(deps) };
}
describe('round calendar service', () => {
  it('resolves season, captures time before querying, and returns serializable models', async () => {
    const { deps, calls, service } = setup();
    const state = await service.getRoundCalendar();
    expect(calls).toEqual(['season', 'clock', 'query']);
    expect(deps.listRows).toHaveBeenCalledWith('2025-2026');
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    expect(ROUND_CALENDAR_POLICY.freshness).toContain('uncached');
  });
  it('does not cache calls and retains the legacy two-snapshot completed-round read', async () => {
    const { deps, service } = setup();
    expect(await service.getLastCompletedRoundId()).toBe(7);
    expect((await service.getLastCompletedCalendarRound())?.roundId).toBe(7);
    expect(deps.listRows).toHaveBeenCalledTimes(3);
    deps.listRows.mockResolvedValue([]);
    expect(await service.getRoundCalendar()).toEqual({ currentRound: null, nextRound: null });
  });
  it('short-circuits the second read for a falsy selected ID', async () => {
    const { deps, service } = setup();
    deps.listRows.mockResolvedValue([{ ...row, roundId: 0 }]);
    expect(await service.getLastCompletedCalendarRound()).toBeNull();
    expect(deps.listRows).toHaveBeenCalledTimes(1);
  });
  it('propagates season and query failures without manufacturing empty success', async () => {
    const { deps, service } = setup();
    deps.resolveSeason.mockRejectedValueOnce(new Error('season unavailable'));
    await expect(service.getRoundCalendar()).rejects.toThrow('season unavailable');
    expect(deps.listRows).not.toHaveBeenCalled();
    deps.listRows.mockRejectedValueOnce(new Error('query unavailable'));
    await expect(service.getRoundCalendar()).rejects.toThrow('query unavailable');
  });
});
