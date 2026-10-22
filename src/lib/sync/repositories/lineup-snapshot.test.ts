import { expect, it, vi } from 'vitest';
import { replaceLineupSnapshot } from './lineup-snapshot';
it.each([false, true])(
  'replaces all rows on one connection and rolls back failures: %s',
  async (fail) => {
    const query = vi.fn(async (sql: string, _params?: unknown[]) => {
      if (fail && sql.includes('INSERT INTO lineups')) throw new Error('fixture insertion failure');
      return { rows: [], rowCount: 0 };
    });
    const release = vi.fn();
    const pool = { connect: vi.fn(async () => ({ query, release })) };
    const run = replaceLineupSnapshot(pool as never, '2026-27', '7', 5142, [
      {
        user_id: '7',
        round_id: 5142,
        round_name: 'Jornada 7',
        player_id: 1,
        is_captain: false,
        role: 'titular',
      },
    ]);
    if (fail) await expect(run).rejects.toThrow('fixture insertion');
    else await run;
    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toBe('BEGIN');
    expect(query.mock.calls.at(-1)?.[0]).toBe(fail ? 'ROLLBACK' : 'COMMIT');
    expect(release).toHaveBeenCalledOnce();
    expect(query.mock.calls.find((call) => call[0].includes('DELETE FROM lineups'))?.[1]).toEqual([
      '2026-27',
      '7',
      5142,
    ]);
  }
);
