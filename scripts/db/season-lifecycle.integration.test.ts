import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { startDisposablePostgres } from './disposable-postgres';
import { runMigrations } from './migrate';

it('creates and freezes explicit seasons and refuses a concurrent sync lock', async () => {
  const fixture = await startDisposablePostgres();
  try {
    await runMigrations(fixture.pool);
    const run = (...args: string[]) =>
      spawnSync(
        process.execPath,
        ['node_modules/tsx/dist/cli.mjs', 'scripts/db/season-lifecycle.ts', ...args],
        {
          encoding: 'utf8',
          env: {
            PATH: process.env.PATH,
            DATABASE_URL: fixture.connectionString,
            BACKUP_CONFIRMED: 'true',
          },
        }
      );
    expect(
      run('create-next', '--season=2027-28', '--league=9', '--start-date=2027-09-01').status
    ).toBe(0);
    const season = (
      await fixture.pool.query("SELECT status, source_league_id FROM seasons WHERE id='2027-28'")
    ).rows[0];
    expect(season).toEqual({ status: 'active', source_league_id: '9' });
    expect(
      run('create-next', '--season=2028-29', '--league=9', '--start-date=2028-09-01').status
    ).toBe(1);
    const lock = await fixture.pool.connect();
    try {
      await lock.query('SELECT pg_advisory_lock(823744)');
      expect(run('freeze', '--season=2027-28').status).toBe(1);
      expect(
        (await fixture.pool.query("SELECT status FROM seasons WHERE id='2027-28'")).rows[0].status
      ).toBe('active');
    } finally {
      await lock.query('SELECT pg_advisory_unlock(823744)');
      lock.release();
    }
    expect(run('freeze', '--season=2027-28').status).toBe(0);
    expect(
      (await fixture.pool.query("SELECT status FROM seasons WHERE id='2027-28'")).rows[0].status
    ).toBe('frozen');
  } finally {
    await fixture.cleanup();
  }
}, 15000);
