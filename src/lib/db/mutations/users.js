/**
 * User & Squad Mutations (Postgres)
 * Handles Write operations for users, squads, lineups, and initial squad inference.
 */
export function prepareUserMutations(db) {
  return {
    resetAllOwners: async () => {
      await db.query('UPDATE players SET owner_id = NULL');
    },

    getAllUsers: async () => {
      // Return objects with .all() behavior (array of rows)
      const res = await db.query('SELECT id, name, icon, color_index FROM users');
      return {
        all: () => res.rows,
        iterate: () => res.rows, // simplified iterator access
      };
    },

    updatePlayerOwner: async (params) => {
      await db.query('UPDATE players SET owner_id = $1 WHERE id = $2', [
        params.owner_id,
        params.player_id,
      ]);
    },

    updateUserColor: async (colorIndex, userId) => {
      await db.query('UPDATE users SET color_index = $1 WHERE id = $2', [colorIndex, userId]);
    },

    upsertUser: async (params) => {
      const sql = `
        INSERT INTO users (id, name, icon) VALUES ($1, $2, $3)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=COALESCE(excluded.icon, users.icon)
      `;
      await db.query(sql, [params.id, params.name, params.icon]);
    },

    insertInitialSquad: async (params) => {
      const sql = `
        INSERT INTO initial_squads (user_id, player_id, price) 
        VALUES ($1, $2, $3)
        ON CONFLICT(user_id, player_id) DO NOTHING
      `;
      await db.query(sql, [params.user_id, params.player_id, params.price]);
    },

    getInitialPrice: async (playerId, date) => {
      const sql = `
        SELECT price FROM market_values 
        WHERE player_id = $1 AND date <= $2
        ORDER BY date DESC
        LIMIT 1
      `;
      const res = await db.query(sql, [playerId, date]);
      return res.rows[0];
    },

    getPlayersSoldByUser: async (sellerName1, sellerName2) => {
      // sellerName2 is same as 1 usually, logic copied from SQLite params
      const sql = `
        SELECT DISTINCT player_id 
        FROM fichajes 
        WHERE vendedor = $1 OR vendedor = $2
      `;
      const res = await db.query(sql, [sellerName1, sellerName2]);
      return res.rows;
    },

    getPlayersOwnedByUser: async (ownerId) => {
      const res = await db.query('SELECT id as player_id FROM players WHERE owner_id = $1', [
        ownerId,
      ]);
      return res.rows;
    },

    getPurchasesByPlayerAndUser: async (playerId, buyerName1, buyerName2) => {
      const sql = `
        SELECT timestamp, 'buy' as type
        FROM fichajes
        WHERE player_id = $1 AND (comprador = $2 OR comprador = $3)
        ORDER BY timestamp ASC
      `;
      const res = await db.query(sql, [playerId, buyerName1, buyerName2]);
      return res.rows;
    },

    getSalesByPlayerAndUser: async (playerId, sellerName1, sellerName2) => {
      const sql = `
        SELECT timestamp, 'sell' as type
        FROM fichajes
        WHERE player_id = $1 AND (vendedor = $2 OR vendedor = $3)
        ORDER BY timestamp ASC
      `;
      const res = await db.query(sql, [playerId, sellerName1, sellerName2]);
      return res.rows;
    },

    upsertLineup: async (params) => {
      const sql = `
        INSERT INTO lineups (user_id, round_id, round_name, player_id, is_captain, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT(user_id, round_id, player_id) DO UPDATE SET
        is_captain=excluded.is_captain,
        role=excluded.role
      `;
      await db.query(sql, [
        params.user_id,
        params.round_id,
        params.round_name,
        params.player_id,
        params.is_captain,
        params.role,
      ]);
    },

    upsertUserRound: async (params) => {
      // SQLite params were array [val, val...] in .run()
      // Now we use named params in object for consistency or array?
      // The calling code (06-lineups.js) passes: upsertUserRound.run(uid, rid, rname, pts, part, align)
      // I should update the calling code to pass an object, OR update this signature to accept args.
      // To keep it clean, I will assume calling code passes an object or args.
      // Wait, 06-lineups.js likely passes separate args or an array.
      // I will accept an object `params` for consistency, merging with my other patterns.
      // I WILL NEED TO UPDATE 06-lineups.js to pass an object { user_id, ... }

      const sql = `
        INSERT INTO user_rounds (user_id, round_id, round_name, points, participated, alineacion)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT(user_id, round_id) DO UPDATE SET
        points=excluded.points,
        participated=excluded.participated,
        round_name=excluded.round_name,
        alineacion=excluded.alineacion
      `;
      await db.query(sql, [
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
      await db.query('DELETE FROM initial_squads');
    },

    getTransfersForBacktracking: async () => {
      const res = await db.query(`
        SELECT timestamp, player_id, vendedor, comprador 
        FROM fichajes 
        ORDER BY timestamp DESC
      `);
      return res.rows;
    },
  };
}
