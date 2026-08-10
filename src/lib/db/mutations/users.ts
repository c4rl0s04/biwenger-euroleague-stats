import { Pool } from 'pg';
import { CONFIG } from '../../config';
import { DEFAULT_SEASON_ID } from '../schema';

// Using a loose type for the db client to support both pg.Pool and the mock object
export type DbClient =
  | Pool
  | {
      query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
    };

// ==========================================
// INTERFACES
// ==========================================

export interface UpdatePlayerOwnerParams {
  owner_id: string | null;
  player_id: number;
}

export interface UpsertUserParams {
  id: string; // text in schema
  name: string;
  icon: string | null;
}

export interface InsertInitialSquadParams {
  user_id: string; // text in schema
  player_id: number;
  price: number;
}

export interface UpsertLineupParams {
  user_id: string; // text in schema
  round_id: number;
  round_name: string; // Add round_name as it's used in the insert value list
  player_id: number;
  is_captain: boolean; // boolean in schema, sometimes integer is passed, let's keep boolean
  role: string | null;
}

export interface DeleteUserLineupParams {
  user_id: string;
  round_id: number;
}

export interface UpsertUserRoundParams {
  user_id: string;
  round_id: number;
  round_name: string; // Used in the values array
  points: number;
  participated: boolean; // boolean in schema
  alineacion: number | null; // Changed to number or null based on actual data
}

export interface UserMutations {
  resetAllOwners: () => Promise<void>;
  resetActiveOwners: () => Promise<void>;
  resetUserSquad: (userId: string) => Promise<void>;
  getAllUsers: () => Promise<{ all: () => any[]; iterate: () => any[] }>;
  markSeasonUsersInactiveExcept: (activeUserIds: string[]) => Promise<void>;
  updatePlayerOwner: (params: UpdatePlayerOwnerParams) => Promise<void>;
  updateUserColor: (colorIndex: number, userId: string) => Promise<void>;
  upsertUser: (params: UpsertUserParams) => Promise<void>;
  insertInitialSquad: (params: InsertInitialSquadParams) => Promise<void>;
  getInitialPrice: (playerId: number, date: string) => Promise<{ price: number } | undefined>;
  getPlayersSoldByUser: (
    sellerName1: string,
    sellerName2: string
  ) => Promise<{ player_id: number }[]>;
  getPlayersOwnedByUser: (ownerId: string) => Promise<{ player_id: number }[]>;
  getPurchasesByPlayerAndUser: (
    playerId: number,
    buyerName1: string,
    buyerName2: string
  ) => Promise<{ timestamp: number; type: string }[]>;
  getSalesByPlayerAndUser: (
    playerId: number,
    sellerName1: string,
    sellerName2: string
  ) => Promise<{ timestamp: number; type: string }[]>;
  upsertLineup: (params: UpsertLineupParams) => Promise<void>;
  deleteUserLineup: (params: DeleteUserLineupParams) => Promise<void>;
  upsertUserRound: (params: UpsertUserRoundParams) => Promise<void>;
  clearInitialSquads: () => Promise<void>;
  getTransfersForBacktracking: () => Promise<
    { timestamp: number; player_id: number; vendedor: string; comprador: string }[]
  >;
  updateUserPassword: (password: string, userId: string) => Promise<void>;
}

export interface UserMutationOptions {
  seasonId?: string;
}

/**
 * User & Squad Mutations (Postgres)
 * Handles Write operations for users, squads, lineups, and initial squad inference.
 */
export function prepareUserMutations(
  db: DbClient,
  options: UserMutationOptions = {}
): UserMutations {
  const seasonId = options.seasonId ?? CONFIG.SEASON.ID;

  return {
    resetAllOwners: async () => {
      if (seasonId === DEFAULT_SEASON_ID) {
        await db.query('UPDATE players SET owner_id = NULL');
      }
      await db.query(
        'UPDATE player_seasons SET owner_id = NULL, updated_at = NOW() WHERE season_id = $1',
        [seasonId]
      );
    },

    resetActiveOwners: async () => {
      // Only reset owners for players belonging to active teams
      if (seasonId === DEFAULT_SEASON_ID) {
        await db.query(`
          UPDATE players
          SET owner_id = NULL
          WHERE team_id IN (SELECT id FROM teams WHERE is_active = true)
        `);
        await db.query(
          `
          UPDATE player_seasons
          SET owner_id = NULL, updated_at = NOW()
          WHERE season_id = $1
            AND team_id IN (SELECT id FROM teams WHERE is_active = true)
        `,
          [seasonId]
        );
        return;
      }

      await db.query(
        `
        UPDATE player_seasons
        SET owner_id = NULL, updated_at = NOW()
        WHERE season_id = $1
      `,
        [seasonId]
      );
    },

    resetUserSquad: async (userId: string) => {
      if (seasonId === DEFAULT_SEASON_ID) {
        await db.query('UPDATE players SET owner_id = NULL WHERE owner_id = $1', [userId]);
      }
      await db.query(
        'UPDATE player_seasons SET owner_id = NULL, updated_at = NOW() WHERE season_id = $1 AND owner_id = $2',
        [seasonId, userId]
      );
    },

    getAllUsers: async () => {
      const res = await db.query(
        `
        SELECT
          u.id,
          COALESCE(us.name, u.name) AS name,
          COALESCE(us.icon, u.icon) AS icon,
          COALESCE(us.color_index, u.color_index, 0) AS color_index
        FROM user_seasons us
        JOIN users u ON u.id = us.user_id
        WHERE us.season_id = $1
          AND COALESCE(us.status, 'active') = 'active'
        ORDER BY COALESCE(us.name, u.name), u.id
      `,
        [seasonId]
      );
      return {
        all: () => res.rows,
        iterate: () => res.rows, // simplified iterator access
      };
    },

    markSeasonUsersInactiveExcept: async (activeUserIds: string[]) => {
      if (activeUserIds.length === 0) {
        await db.query(
          `
          UPDATE user_seasons
          SET status = 'inactive', updated_at = NOW()
          WHERE season_id = $1
        `,
          [seasonId]
        );
        return;
      }

      await db.query(
        `
        UPDATE user_seasons
        SET status = 'inactive', updated_at = NOW()
        WHERE season_id = $1
          AND NOT (user_id = ANY($2::text[]))
      `,
        [seasonId, activeUserIds]
      );
    },

    updatePlayerOwner: async (params: UpdatePlayerOwnerParams) => {
      if (seasonId === DEFAULT_SEASON_ID) {
        await db.query('UPDATE players SET owner_id = $1 WHERE id = $2', [
          params.owner_id,
          params.player_id,
        ]);
      }
      await db.query(
        `
        INSERT INTO player_seasons (season_id, player_id, owner_id, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT(season_id, player_id) DO UPDATE SET
          owner_id = excluded.owner_id,
          updated_at = NOW()
      `,
        [seasonId, params.player_id, params.owner_id]
      );
    },

    updateUserColor: async (colorIndex: number, userId: string) => {
      if (seasonId === DEFAULT_SEASON_ID) {
        await db.query('UPDATE users SET color_index = $1 WHERE id = $2', [colorIndex, userId]);
      }
      await db.query(
        `
        INSERT INTO user_seasons (season_id, user_id, color_index, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT(season_id, user_id) DO UPDATE SET
          color_index = excluded.color_index,
          updated_at = NOW()
      `,
        [seasonId, userId, colorIndex]
      );
    },

    upsertUser: async (params: UpsertUserParams) => {
      const sql = `
        INSERT INTO users (id, name, icon) VALUES ($1, $2, $3)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=COALESCE(excluded.icon, users.icon)
      `;
      await db.query(sql, [params.id, params.name, params.icon]);
      await db.query(
        `
        INSERT INTO user_seasons (season_id, user_id, name, icon, status, updated_at)
        VALUES ($1, $2, $3, $4, 'active', NOW())
        ON CONFLICT(season_id, user_id) DO UPDATE SET
          name = excluded.name,
          icon = COALESCE(excluded.icon, user_seasons.icon),
          status = 'active',
          updated_at = NOW()
      `,
        [seasonId, params.id, params.name, params.icon]
      );
    },

    insertInitialSquad: async (params: InsertInitialSquadParams) => {
      const sql = `
        INSERT INTO initial_squads (season_id, user_id, player_id, price)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT(season_id, user_id, player_id) DO NOTHING
      `;
      await db.query(sql, [seasonId, params.user_id, params.player_id, params.price]);
    },

    getInitialPrice: async (playerId: number, date: string) => {
      const sql = `
        SELECT price FROM market_values
        WHERE season_id = $1 AND player_id = $2 AND date <= $3
        ORDER BY date DESC
        LIMIT 1
      `;
      const res = await db.query(sql, [seasonId, playerId, date]);
      return res.rows[0];
    },

    getPlayersSoldByUser: async (sellerName1: string, sellerName2: string) => {
      // sellerName2 is same as 1 usually, logic copied from SQLite params
      const sql = `
        SELECT DISTINCT player_id
        FROM fichajes
        WHERE season_id = $1 AND (vendedor = $2 OR vendedor = $3)
      `;
      const res = await db.query(sql, [seasonId, sellerName1, sellerName2]);
      return res.rows;
    },

    getPlayersOwnedByUser: async (ownerId: string) => {
      const res = await db.query(
        'SELECT player_id FROM player_seasons WHERE season_id = $1 AND owner_id = $2',
        [seasonId, ownerId]
      );
      return res.rows;
    },

    getPurchasesByPlayerAndUser: async (
      playerId: number,
      buyerName1: string,
      buyerName2: string
    ) => {
      const sql = `
        SELECT timestamp, 'buy' as type
        FROM fichajes
        WHERE season_id = $1 AND player_id = $2 AND (comprador = $3 OR comprador = $4)
        ORDER BY timestamp ASC
      `;
      const res = await db.query(sql, [seasonId, playerId, buyerName1, buyerName2]);
      return res.rows;
    },

    getSalesByPlayerAndUser: async (playerId: number, sellerName1: string, sellerName2: string) => {
      const sql = `
        SELECT timestamp, 'sell' as type
        FROM fichajes
        WHERE season_id = $1 AND player_id = $2 AND (vendedor = $3 OR vendedor = $4)
        ORDER BY timestamp ASC
      `;
      const res = await db.query(sql, [seasonId, playerId, sellerName1, sellerName2]);
      return res.rows;
    },

    upsertLineup: async (params: UpsertLineupParams) => {
      const sql = `
        INSERT INTO lineups (season_id, user_id, round_id, round_name, player_id, is_captain, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT(season_id, user_id, round_id, player_id) DO UPDATE SET
        is_captain=excluded.is_captain,
        role=excluded.role
      `;
      await db.query(sql, [
        seasonId,
        params.user_id,
        params.round_id,
        params.round_name,
        params.player_id,
        params.is_captain,
        params.role,
      ]);
    },

    deleteUserLineup: async (params: DeleteUserLineupParams) => {
      const sql = `DELETE FROM lineups WHERE season_id = $1 AND user_id = $2 AND round_id = $3`;
      await db.query(sql, [seasonId, params.user_id, params.round_id]);
    },

    upsertUserRound: async (params: UpsertUserRoundParams) => {
      // SQLite params were array [val, val...] in .run()
      // Now we use named params in object for consistency or array?
      // The calling code (06-lineups.js) passes: upsertUserRound.run(uid, rid, rname, pts, part, align)
      // I should update the calling code to pass an object, OR update this signature to accept args.
      // To keep it clean, I will assume calling code passes an object or args.
      // Wait, 06-lineups.js likely passes separate args or an array.
      // I will accept an object `params` for consistency, merging with my other patterns.
      // I WILL NEED TO UPDATE 06-lineups.js to pass an object { user_id, ... }

      const sql = `
        INSERT INTO user_rounds (season_id, user_id, round_id, round_name, points, participated, alineacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT(season_id, user_id, round_id) DO UPDATE SET
        points=excluded.points,
        participated=excluded.participated,
        round_name=excluded.round_name,
        alineacion=excluded.alineacion
      `;
      await db.query(sql, [
        seasonId,
        params.user_id,
        params.round_id,
        params.round_name,
        params.points,
        params.participated,
        params.alineacion,
      ]);
    },

    // Step 9 Helpers
    clearInitialSquads: async () => {
      await db.query('DELETE FROM initial_squads WHERE season_id = $1', [seasonId]);
    },

    getTransfersForBacktracking: async () => {
      const res = await db.query(
        `
        SELECT timestamp, player_id, vendedor, comprador
        FROM fichajes
        WHERE season_id = $1
        ORDER BY timestamp DESC
      `,
        [seasonId]
      );
      return res.rows;
    },

    updateUserPassword: async (password: string, userId: string) => {
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [password, userId]);
    },
  };
}
