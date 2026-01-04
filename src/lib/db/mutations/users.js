/**
 * User & Squad Mutations
 * Handles Write operations for users, squads, lineups, and initial squad inference.
 */

/**
 * Prepares Statements for User/Squad Mutations
 * @param {import('better-sqlite3').Database} db
 * @returns {{
 *   resetAllOwners: import('better-sqlite3').Statement,
 *   getAllUsers: import('better-sqlite3').Statement,
 *   updatePlayerOwner: import('better-sqlite3').Statement,
 *   upsertUser: import('better-sqlite3').Statement,
 *   insertInitialSquad: import('better-sqlite3').Statement,
 *   getInitialPrice: import('better-sqlite3').Statement,
 *   getPlayersSoldByUser: import('better-sqlite3').Statement,
 *   getPlayersOwnedByUser: import('better-sqlite3').Statement,
 *   getPurchasesByPlayerAndUser: import('better-sqlite3').Statement,
 *   getSalesByPlayerAndUser: import('better-sqlite3').Statement,
 *   upsertLineup: import('better-sqlite3').Statement,
 *   upsertUserRound: import('better-sqlite3').Statement
 * }}
 */
export function prepareUserMutations(db) {
  // --- Squads Sync ---

  const resetAllOwners = db.prepare('UPDATE players SET owner_id = NULL');

  const getAllUsers = db.prepare('SELECT id, name FROM users');

  const updatePlayerOwner = db.prepare(
    'UPDATE players SET owner_id = @owner_id WHERE id = @player_id'
  );

  // --- User / Standings ---

  const upsertUser = db.prepare(`
    INSERT INTO users (id, name, icon) VALUES (@id, @name, @icon)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=COALESCE(excluded.icon, users.icon)
  `);
  // Note: sync-lineups uses INSERT OR IGNORE just for ID/Name, 
  // sync-standings updates Icon. This unified query handles both (if icon is null, preserve existing).

  // --- Initial Squads Inference ---

  const insertInitialSquad = db.prepare(`
      INSERT OR IGNORE INTO initial_squads (user_id, player_id, price) 
      VALUES (@user_id, @player_id, @price)
  `);

  const getInitialPrice = db.prepare(`
    SELECT price FROM market_values 
    WHERE player_id = ? AND date <= ?
    ORDER BY date DESC
    LIMIT 1
  `);

  // Sub-queries for inference logic
  const getPlayersSoldByUser = db.prepare(`
      SELECT DISTINCT player_id 
      FROM fichajes 
      WHERE vendedor = ? OR vendedor = ?
  `);

  const getPlayersOwnedByUser = db.prepare(`
      SELECT id as player_id 
      FROM players 
      WHERE owner_id = ?
  `);

  const getPurchasesByPlayerAndUser = db.prepare(`
      SELECT timestamp, 'buy' as type
      FROM fichajes
      WHERE player_id = ? AND (comprador = ? OR comprador = ?)
      ORDER BY timestamp ASC
  `);

  const getSalesByPlayerAndUser = db.prepare(`
      SELECT timestamp, 'sell' as type
      FROM fichajes
      WHERE player_id = ? AND (vendedor = ? OR vendedor = ?)
      ORDER BY timestamp ASC
  `);


  // --- Lineups & User Rounds ---

  const upsertLineup = db.prepare(`
       INSERT INTO lineups (user_id, round_id, round_name, player_id, is_captain, role)
       VALUES (@user_id, @round_id, @round_name, @player_id, @is_captain, @role)
       ON CONFLICT(user_id, round_id, player_id) DO UPDATE SET
       is_captain=excluded.is_captain,
       role=excluded.role
  `);

  const upsertUserRound = db.prepare(`
        INSERT INTO user_rounds (user_id, round_id, round_name, points, participated, alineacion)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, round_id) DO UPDATE SET
        points=excluded.points,
        participated=excluded.participated,
        round_name=excluded.round_name,
        alineacion=excluded.alineacion
  `);

  return {
    resetAllOwners,
    getAllUsers,
    updatePlayerOwner,
    upsertUser,
    insertInitialSquad,
    getInitialPrice,
    getPlayersSoldByUser,
    getPlayersOwnedByUser,
    getPurchasesByPlayerAndUser,
    getSalesByPlayerAndUser,
    upsertLineup,
    upsertUserRound,
  };
}
