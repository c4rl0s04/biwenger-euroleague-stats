import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  startDisposablePostgres,
  type DisposablePostgres,
} from '../../../../../../scripts/db/disposable-postgres';
import { runMigrations } from '../../../../../../scripts/db/migrate';
import { syncOfficialPostseason } from '../postseason';
import { fixtureManager, fixtureProvider, reportRows } from './postseason-fixtures';

// Never loads application credentials or connects to DATABASE_URL.
describe.skipIf(process.env.RUN_POSTSEASON_DB_TESTS !== 'true')(
  'euroleague-postseason PostgreSQL integration',
  () => {
    let local: DisposablePostgres;
    beforeAll(async () => {
      local = await startDisposablePostgres();
      await runMigrations(local.pool);
      // Migrations seed the 2025-26 season row.
    }, 120000);
    afterAll(async () => {
      await local?.cleanup();
    });

    const rows = async () =>
      (
        await local.pool.query(
          `SELECT game_code, phase_code, round_code, round_number, is_played,
                  home_score, away_score, synced_at
           FROM official_schedule_games WHERE season_id = '2025-26' ORDER BY game_code`
        )
      ).rows;

    it('stores phases, fills postseason scores and never fetches RS reports', async () => {
      const { provider, reportRequests } = fixtureProvider();
      const counts = await syncOfficialPostseason(fixtureManager(local.pool, provider));

      expect(counts).toMatchObject({
        games: 23,
        changed: 23,
        RS: 1,
        PI: 3,
        PO: 16,
        FF: 3,
        scored: 22,
        unavailable: 0,
      });
      expect(reportRequests).not.toContain(380);
      expect(reportRequests).toHaveLength(22);

      const stored = await rows();
      const byCode = new Map(stored.map((row) => [row.game_code, row]));
      expect(byCode.get(380)).toMatchObject({
        phase_code: 'RS',
        round_code: 'Regular Season',
        home_score: null,
        away_score: null,
      });
      expect(byCode.get(381)).toMatchObject({ phase_code: 'PI', round_code: 'A' });
      expect(byCode.get(384)).toMatchObject({ phase_code: 'PO', round_code: 'PLAYOFF A' });
      for (const report of reportRows.filter((row) => row['phaseType.code'] !== 'RS')) {
        expect(byCode.get(report.Gamecode as number)).toMatchObject({
          home_score: report['local.score'],
          away_score: report['road.score'],
        });
      }
      expect(byCode.get(406)).toMatchObject({
        phase_code: 'FF',
        round_code: 'CHAMPIONSHIP GAME',
        round_number: 47,
        is_played: true,
      });
    });

    it('produces no changes on a second run', async () => {
      const before = await rows();
      const { provider, reportRequests } = fixtureProvider();
      const counts = await syncOfficialPostseason(fixtureManager(local.pool, provider));

      expect(counts).toMatchObject({ changed: 0, scored: 0, unavailable: 0 });
      expect(reportRequests).toEqual([]);
      expect(await rows()).toEqual(before);
    });

    it('leaves other seasons untouched', async () => {
      const other = await local.pool.query(
        `SELECT COUNT(*)::int AS n FROM official_schedule_games WHERE season_id <> '2025-26'`
      );
      expect(other.rows[0].n).toBe(0);
    });
  }
);
