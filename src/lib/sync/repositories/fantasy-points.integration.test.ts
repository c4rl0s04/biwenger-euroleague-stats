import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  startDisposablePostgres,
  type DisposablePostgres,
} from '../../../../scripts/db/disposable-postgres';
import { runMigrations } from '../../../../scripts/db/migrate';
import { getFantasyPointLiveRounds, hasActiveMatchesInWindow } from './sync-queries';
import { preparePlayerStatMutations } from '../../db/mutations/player-stats';
import { syncFantasyPoints } from '../services/biwenger/fantasy-points';

// Never loads application credentials or connects to DATABASE_URL.
describe.skipIf(process.env.RUN_FANTASY_POINTS_DB_TESTS !== 'true')(
  'fantasy points PostgreSQL integration',
  () => {
    let local: DisposablePostgres;
    beforeAll(async () => {
      local = await startDisposablePostgres();
      await runMigrations(local.pool);
      await local.pool
        .query(`INSERT INTO seasons (id,name,status) VALUES ('2026-27','Test','active');
      INSERT INTO players (id,name) VALUES (900001,'Fantasy test');
      INSERT INTO matches (season_id,round_id,round_name,date,status) VALUES
      ('2026-27',1,'Jornada 1',NOW()-INTERVAL '10 days','finished'),
      ('2026-27',2,'Jornada 2',NOW()-INTERVAL '2 hours','live'),
      ('2026-27',3,'Jornada 3',NOW()-INTERVAL '8 hours','finished'),
      ('2026-27',4,'Jornada 4',NOW()+INTERVAL '30 minutes','scheduled'),
      ('2026-27',5,'Jornada 5',NOW()+INTERVAL '2 days','scheduled'),
      ('2026-27',6,'Jornada 6',NOW()-INTERVAL '2 days','live'),
      ('2025-26',7,'Jornada 7',NOW(),'live');
      INSERT INTO player_round_stats (season_id,player_id,round_id,fantasy_points,points)
      VALUES ('2026-27',900001,2,12,18),('2025-26',900001,2,42,20)`);
    }, 120000);
    afterAll(async () => {
      await local?.cleanup();
    });

    it('selects ongoing, postponed-live and recent finished rounds, including after the final whistle', async () => {
      expect(await hasActiveMatchesInWindow('2026-27', 1, local.pool)).toBe(true);
      expect(await hasActiveMatchesInWindow('2026-27', 5, local.pool)).toBe(false);
      const selected = async () =>
        (await getFantasyPointLiveRounds('2026-27', local.pool)).map((r) => r.id);
      expect(await selected()).toEqual([2, 3, 4, 6]);
      await local.pool.query(
        "UPDATE matches SET status='finished' WHERE season_id='2026-27' AND round_id=2"
      );
      expect(await selected()).toEqual([2, 3, 4, 6]);
    });

    it('preserves scores on null and allows zero, negative and corrected scores without changing sporting data or another season', async () => {
      const mutations = preparePlayerStatMutations(local.pool, '2026-27');
      const score = async () =>
        (
          await local.pool.query(
            "SELECT fantasy_points FROM player_round_stats WHERE season_id='2026-27' AND player_id=900001 AND round_id=2"
          )
        ).rows[0].fantasy_points;
      await mutations.updateFantasyPoints({ playerId: 900001, roundId: 2, fantasyPoints: null });
      expect(await score()).toBe(12);
      const manager = { context: { db: local.pool, seasonId: '2026-27' } };
      for (const points of [0, -2, 15, 15, null]) {
        await syncFantasyPoints(
          manager as never,
          { id: 2, dbId: 2, name: 'Jornada 2' },
          {
            fetchRoundGames: async () => ({
              games: [{ home: { reports: [{ player: { id: 900001 }, points }] } }],
            }),
          }
        );
        expect(await score()).toBe(points ?? 15);
      }
      const rows = await local.pool.query(
        'SELECT season_id,fantasy_points,points FROM player_round_stats WHERE player_id=900001 ORDER BY season_id'
      );
      expect(rows.rows).toEqual([
        { season_id: '2025-26', fantasy_points: 42, points: 20 },
        { season_id: '2026-27', fantasy_points: 15, points: 18 },
      ]);
    });
  }
);
