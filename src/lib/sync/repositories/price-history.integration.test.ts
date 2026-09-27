import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  startDisposablePostgres,
  type DisposablePostgres,
} from '../../../../scripts/db/disposable-postgres';
import { runMigrations } from '../../../../scripts/db/migrate';
import { createPriceHistoryRepository } from './price-history';
import { priceHistoryCheckpointKey } from '../price-history';

// Always starts its own disposable loopback database; never consumes DATABASE_URL or .env.
describe.skipIf(process.env.RUN_PRICE_HISTORY_DB_TESTS !== 'true')(
  'price history PostgreSQL reconciliation',
  () => {
    let local: DisposablePostgres;
    const bounds = { startsAt: '2026-09-01', endsAt: null };
    const checkedAt = '2026-09-27T12:00:00.000Z';
    beforeAll(async () => {
      local = await startDisposablePostgres();
      await runMigrations(local.pool);
      await local.pool.query(`INSERT INTO seasons (id, name, status, starts_at)
      VALUES ('2026-27', 'Test season', 'active', '2026-09-01')
      ON CONFLICT (id) DO UPDATE SET starts_at = EXCLUDED.starts_at`);
      await local.pool.query(
        `INSERT INTO players (id, name) VALUES (900001, 'History test'), (900002, 'Rollback test')`
      );
      await local.pool.query(`INSERT INTO player_seasons (season_id, player_id, price)
      VALUES ('2026-27', 900001, 1820000), ('2026-27', 900002, 10), ('2025-26', 900001, 100)`);
      await local.pool.query(`INSERT INTO market_values (season_id, player_id, date, price) VALUES
      ('2026-27', 900001, '2026-09-23', 1570000),
      ('2026-27', 900001, '2026-09-24', 1570000),
      ('2026-27', 900001, '2026-09-26', 1850000),
      ('2025-26', 900001, '2025-09-24', 100)`);
    }, 120000);
    afterAll(async () => {
      await local?.cleanup();
    });

    it('corrects stale September 24, fills September 25 and preserves other facts on rerun', async () => {
      const repo = createPriceHistoryRepository(local.pool);
      const prices = [
        { date: '2026-09-24', price: 1740000 },
        { date: '2026-09-25', price: 1850000 },
        { date: '2026-09-26', price: 1850000 },
      ];
      expect(await repo.reconcile('2026-27', 900001, prices, bounds, checkedAt)).toEqual({
        inserted: 1,
        corrected: 1,
        unchanged: 1,
      });
      expect(await repo.reconcile('2026-27', 900001, prices, bounds, checkedAt)).toEqual({
        inserted: 0,
        corrected: 0,
        unchanged: 3,
      });
      const rows = await local.pool.query(`SELECT season_id, date::text, price FROM market_values
      WHERE player_id=900001 ORDER BY season_id, date`);
      expect(rows.rows).toEqual([
        { season_id: '2025-26', date: '2025-09-24', price: 100 },
        { season_id: '2026-27', date: '2026-09-23', price: 1570000 },
        { season_id: '2026-27', date: '2026-09-24', price: 1740000 },
        { season_id: '2026-27', date: '2026-09-25', price: 1850000 },
        { season_id: '2026-27', date: '2026-09-26', price: 1850000 },
      ]);
      const cache = await local.pool.query(
        `SELECT price FROM player_seasons WHERE season_id='2026-27' AND player_id=900001`
      );
      expect(cache.rows[0].price).toBe(1820000);
      const state = await repo.load('2026-27');
      expect(state.bounds).toEqual(bounds);
      expect(state.players.find((p) => p.playerId === 900001)?.checkedAt).toBe(checkedAt);
      expect(state.players.find((p) => p.playerId === 900002)?.checkedAt).toBeNull();
      expect((await repo.load('2025-26')).players[0].checkedAt).toBeNull();
    });

    it('rolls back price writes when checkpoint persistence fails', async () => {
      const repo = createPriceHistoryRepository(local.pool);
      await local.pool.query(`ALTER TABLE sync_meta ADD CONSTRAINT reject_test_checkpoint
      CHECK (key <> 'biwenger-price-history:v1:2026-27:900002')`);
      try {
        await expect(
          repo.reconcile('2026-27', 900002, [{ date: '2026-09-25', price: 10 }], bounds, checkedAt)
        ).rejects.toThrow();
        expect(
          (await local.pool.query('SELECT * FROM market_values WHERE player_id=900002')).rows
        ).toEqual([]);
        expect(
          (
            await local.pool.query('SELECT * FROM sync_meta WHERE key=$1', [
              priceHistoryCheckpointKey('2026-27', 900002),
            ])
          ).rows
        ).toEqual([]);
      } finally {
        await local.pool.query('ALTER TABLE sync_meta DROP CONSTRAINT reject_test_checkpoint');
      }
      expect(
        await repo.reconcile(
          '2026-27',
          900002,
          [{ date: '2026-09-25', price: 10 }],
          bounds,
          checkedAt
        )
      ).toEqual({ inserted: 1, corrected: 0, unchanged: 0 });
    });

    it('checkpoints a valid empty response without deleting existing prices', async () => {
      const repo = createPriceHistoryRepository(local.pool);
      expect(await repo.reconcile('2026-27', 900001, [], bounds, checkedAt)).toEqual({
        inserted: 0,
        corrected: 0,
        unchanged: 0,
      });
      expect(
        (
          await local.pool.query(
            'SELECT COUNT(*)::int AS n FROM market_values WHERE player_id=900001'
          )
        ).rows[0].n
      ).toBe(5);
    });
    it('invalidates only selected season/player checkpoints without touching history or other metadata', async () => {
      const repo = createPriceHistoryRepository(local.pool);
      const otherSeasonKey = priceHistoryCheckpointKey('2025-26', 900001);
      await local.pool.query('INSERT INTO sync_meta (key, value, updated_at) VALUES ($1, $2, $3)', [
        otherSeasonKey,
        'preserve',
        checkedAt,
      ]);
      await repo.invalidateCheckpoints('2026-27', [900001]);
      const current = await repo.load('2026-27');
      expect(current.players.find((p) => p.playerId === 900001)?.checkedAt).toBeNull();
      expect(current.players.find((p) => p.playerId === 900002)?.checkedAt).toBe(checkedAt);
      expect(
        (await local.pool.query('SELECT value FROM sync_meta WHERE key=$1', [otherSeasonKey]))
          .rows[0].value
      ).toBe('preserve');
      expect(
        (
          await local.pool.query(
            'SELECT COUNT(*)::int AS n FROM market_values WHERE player_id=900001'
          )
        ).rows[0].n
      ).toBe(5);
    });
  }
);
