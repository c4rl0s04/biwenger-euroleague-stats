import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import {
  users,
  userSeasons,
  userRounds,
  lineups,
  initialSquads,
  finances,
  playerSeasons,
  playoffPredictions,
  porras,
  tournamentFixtures,
  tournamentStandings,
  transferBids,
  userPlayoffMedia,
  marketListings,
} from '@/lib/db/schema';
import { prepareUserMutations } from '@/lib/db/mutations/users';

describe('user and user_seasons multi-season membership normalization', () => {
  describe('1. users table schema invariants', () => {
    it('users table contains only global identity columns and drops icon and colorIndex', () => {
      const columns = getTableColumns(users);
      const columnNames = Object.keys(columns);

      expect(columnNames).toEqual(expect.arrayContaining(['id', 'name', 'email', 'password']));
      expect(columnNames).not.toContain('icon');
      expect(columnNames).not.toContain('colorIndex');
      expect(columnNames).not.toContain('color_index');
      expect(columnNames).not.toContain('biwengerToken');
      expect(columnNames).not.toContain('biwenger_token');
    });
  });

  describe('2. user_seasons table schema invariants', () => {
    it('user_seasons has a composite primary key on (season_id, user_id) and no surrogate id', () => {
      const columns = getTableColumns(userSeasons);
      const columnNames = Object.keys(columns);

      expect(columnNames).not.toContain('id');
      expect(columnNames).toContain('seasonId');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('icon');
      expect(columnNames).toContain('colorIndex');
      expect(columnNames).toContain('status');

      const config = getTableConfig(userSeasons);
      expect(config.primaryKeys).toHaveLength(1);
      const pkColumns = config.primaryKeys[0].columns.map((c) => c.name);
      expect(pkColumns).toEqual(['season_id', 'user_id']);
    });

    it('user_seasons enforces NOT NULL on name, colorIndex (default 0), and status (default active)', () => {
      const columns = getTableColumns(userSeasons);

      expect(columns.name.notNull).toBe(true);
      expect(columns.colorIndex.notNull).toBe(true);
      expect(columns.colorIndex.default).toBe(0);
      expect(columns.status.notNull).toBe(true);
      expect(columns.status.default).toBe('active');
    });

    it('user_seasons does not define redundant unique_user_season constraint', () => {
      const config = getTableConfig(userSeasons);
      const uniqueNames = config.uniqueConstraints.map((uc) => uc.getName());
      expect(uniqueNames).not.toContain('unique_user_season');
    });
  });

  describe('3. composite foreign key integrity across 12 season-scoped tables', () => {
    const seasonalTablesWithCompositeFk = [
      { table: userRounds, fkName: 'user_rounds_season_user_fk', cols: ['season_id', 'user_id'] },
      { table: lineups, fkName: 'lineups_season_user_fk', cols: ['season_id', 'user_id'] },
      {
        table: initialSquads,
        fkName: 'initial_squads_season_user_fk',
        cols: ['season_id', 'user_id'],
      },
      { table: finances, fkName: 'finances_season_user_fk', cols: ['season_id', 'user_id'] },
      {
        table: playerSeasons,
        fkName: 'player_seasons_season_owner_fk',
        cols: ['season_id', 'owner_id'],
      },
      {
        table: playoffPredictions,
        fkName: 'playoff_predictions_season_user_fk',
        cols: ['season_id', 'user_id'],
      },
      { table: porras, fkName: 'porras_season_user_fk', cols: ['season_id', 'user_id'] },
      {
        table: tournamentFixtures,
        fkName: 'tournament_fixtures_season_home_user_fk',
        cols: ['season_id', 'home_user_id'],
      },
      {
        table: tournamentFixtures,
        fkName: 'tournament_fixtures_season_away_user_fk',
        cols: ['season_id', 'away_user_id'],
      },
      {
        table: tournamentStandings,
        fkName: 'tournament_standings_season_user_fk',
        cols: ['season_id', 'user_id'],
      },
      {
        table: transferBids,
        fkName: 'transfer_bids_season_bidder_fk',
        cols: ['season_id', 'bidder_id'],
      },
      {
        table: userPlayoffMedia,
        fkName: 'user_playoff_media_season_user_fk',
        cols: ['season_id', 'user_id'],
      },
      {
        table: marketListings,
        fkName: 'market_listings_season_seller_fk',
        cols: ['season_id', 'seller_id'],
      },
    ];

    it.each(seasonalTablesWithCompositeFk)(
      '$fkName references user_seasons(season_id, user_id) with columns $cols',
      ({ table, fkName, cols }) => {
        const config = getTableConfig(table);
        const fk = config.foreignKeys.find((k) => k.getName() === fkName);
        expect(fk, `Expected foreign key ${fkName} to exist`).toBeDefined();

        const ref = fk!.reference();
        expect(ref.columns.map((c) => c.name)).toEqual(cols);
        expect(getTableConfig(ref.foreignTable).name).toBe('user_seasons');
        expect(ref.foreignColumns.map((c) => c.name)).toEqual(['season_id', 'user_id']);
      }
    );

    it('drops single-column FK to users from playoff_predictions and user_playoff_media', () => {
      const playoffFks = getTableConfig(playoffPredictions).foreignKeys;
      const mediaFks = getTableConfig(userPlayoffMedia).foreignKeys;

      const playoffUserFk = playoffFks.find(
        (fk) => fk.getName() === 'playoff_predictions_user_id_users_id_fk'
      );
      const mediaUserFk = mediaFks.find(
        (fk) => fk.getName() === 'user_playoff_media_user_id_users_id_fk'
      );

      expect(playoffUserFk).toBeUndefined();
      expect(mediaUserFk).toBeUndefined();
    });
  });

  describe('4. migration 0017 structure and idempotency', () => {
    it('0017 migration script contains all required DDL transformations', () => {
      const migrationPath = path.resolve(
        process.cwd(),
        'drizzle/0017_normalize_user_season_membership.sql'
      );
      const sql = readFileSync(migrationPath, 'utf8');

      // Drops redundant user_seasons constraints and indexes
      expect(sql).toContain('DROP CONSTRAINT IF EXISTS "unique_user_season"');
      expect(sql).toContain('DROP INDEX IF EXISTS "idx_user_seasons_season_user"');

      // Drops surrogate id and pkey
      expect(sql).toContain('DROP CONSTRAINT IF EXISTS "user_seasons_pkey"');
      expect(sql).toContain('DROP COLUMN IF EXISTS "id"');

      // Creates composite primary key
      expect(sql).toContain(
        'ADD CONSTRAINT "user_seasons_pkey" PRIMARY KEY("season_id", "user_id")'
      );

      // Adds composite foreign keys referencing user_seasons
      expect(sql).toContain('REFERENCES "public"."user_seasons"("season_id","user_id")');

      // Drops deprecated global manager columns
      expect(sql).toContain('ALTER TABLE "users" DROP COLUMN IF EXISTS "icon"');
      expect(sql).toContain('ALTER TABLE "users" DROP COLUMN IF EXISTS "color_index"');
    });
  });

  describe('5. mutation season isolation and resolution', () => {
    it('updateUserColor updates only user_seasons.color_index for the active season', async () => {
      const mockDb = {
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      };
      const mutations = prepareUserMutations(mockDb as any, { seasonId: '2025-26' });

      await mutations.updateUserColor(4, 'user-123');

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDb.query.mock.calls[0];
      expect(sql).toContain(
        'INSERT INTO user_seasons (season_id, user_id, name, color_index, updated_at)'
      );
      expect(sql).toContain('ON CONFLICT(season_id, user_id) DO UPDATE SET');
      expect(sql).toContain('color_index = excluded.color_index');
      expect(sql).not.toContain('UPDATE users');
      expect(params).toEqual(['2025-26', 'user-123', 4]);
    });

    it('upsertUser updates global users (id, name) and user_seasons (season_id, user_id, name, icon)', async () => {
      const mockDb = {
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      };
      const mutations = prepareUserMutations(mockDb as any, { seasonId: '2025-26' });

      await mutations.upsertUser({
        id: 'user-456',
        name: 'Manager Alpha',
        icon: 'https://example.com/avatar.png',
      });

      expect(mockDb.query).toHaveBeenCalledTimes(2);

      // Call 1: global users directory (id, name only)
      const [usersSql, usersParams] = mockDb.query.mock.calls[0];
      expect(usersSql).toContain('INSERT INTO users (id, name)');
      expect(usersSql).not.toContain('icon');
      expect(usersSql).not.toContain('color_index');
      expect(usersParams).toEqual(['user-456', 'Manager Alpha']);

      // Call 2: seasonal membership (season_id, user_id, name, icon)
      const [seasonSql, seasonParams] = mockDb.query.mock.calls[1];
      expect(seasonSql).toContain(
        'INSERT INTO user_seasons (season_id, user_id, name, icon, status, updated_at)'
      );
      expect(seasonSql).toContain('ON CONFLICT(season_id, user_id) DO UPDATE SET');
      expect(seasonParams).toEqual([
        '2025-26',
        'user-456',
        'Manager Alpha',
        'https://example.com/avatar.png',
      ]);
    });

    it('supports distinct seasonal manager identities across seasons without global fallback', async () => {
      const season24Rows = [
        { id: 'user-1', name: 'Alpha 2024', icon: '/icon-old.png', color_index: 1 },
      ];
      const season25Rows = [
        { id: 'user-1', name: 'Alpha 2025', icon: '/icon-new.png', color_index: 3 },
      ];

      const db24 = {
        query: vi.fn().mockResolvedValue({ rows: season24Rows, rowCount: 1 }),
      };
      const db25 = {
        query: vi.fn().mockResolvedValue({ rows: season25Rows, rowCount: 1 }),
      };

      const mut24 = prepareUserMutations(db24 as any, { seasonId: '2024-25' });
      const mut25 = prepareUserMutations(db25 as any, { seasonId: '2025-26' });

      const res24 = await mut24.getAllUsers();
      const res25 = await mut25.getAllUsers();

      expect(res24.all()[0].name).toBe('Alpha 2024');
      expect(res24.all()[0].icon).toBe('/icon-old.png');
      expect(res24.all()[0].color_index).toBe(1);

      expect(res25.all()[0].name).toBe('Alpha 2025');
      expect(res25.all()[0].icon).toBe('/icon-new.png');
      expect(res25.all()[0].color_index).toBe(3);

      // Verify queries are strictly reading from user_seasons
      expect(db24.query.mock.calls[0][0]).toContain('FROM user_seasons us');
      expect(db24.query.mock.calls[0][0]).not.toContain('JOIN users');
      expect(db25.query.mock.calls[0][0]).toContain('FROM user_seasons us');
      expect(db25.query.mock.calls[0][0]).not.toContain('JOIN users');
    });
  });
});
