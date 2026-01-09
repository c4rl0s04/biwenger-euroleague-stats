/**
 * Market & Board Mutations
 * Handles Write operations for transfers, finances, betting pool (porras), and player fallback creation.
 */

/**
 * Prepares Statements for Market Mutations
 * @param {import('better-sqlite3').Database} db
 * @returns {{
 *   getLastTransferDate: import('better-sqlite3').Statement,
 *   insertTransfer: import('better-sqlite3').Statement,
 *   insertBid: import('better-sqlite3').Statement,
 *   insertFinance: import('better-sqlite3').Statement,
 *   insertPorra: import('better-sqlite3').Statement,
 *   insertPlayerFallback: import('better-sqlite3').Statement
 * }}
 */
export function prepareMarketMutations(db) {
  // getLastTransferDate removed (always full sync)

  const insertTransfer = db.prepare(`
    INSERT OR IGNORE INTO fichajes (timestamp, fecha, player_id, precio, vendedor, comprador)
    VALUES (@timestamp, @fecha, @player_id, @precio, @vendedor, @comprador)
  `);

  const insertBid = db.prepare(`
    INSERT INTO transfer_bids (transfer_id, bidder_id, bidder_name, amount)
    VALUES (@transfer_id, @bidder_id, @bidder_name, @amount)
  `);

  const insertFinance = db.prepare(`
    INSERT INTO finances (user_id, round_id, date, type, amount, description)
    VALUES (@user_id, @round_id, @date, @type, @amount, @description)
  `);

  const insertPorra = db.prepare(`
    INSERT INTO porras (user_id, round_id, round_name, result, aciertos)
    VALUES (@user_id, @round_id, @round_name, @result, @aciertos)
    ON CONFLICT(user_id, round_id) DO UPDATE SET
      result=excluded.result,
      aciertos=excluded.aciertos
  `);

  // Helper to insert unknown players on the fly
  const insertPlayerFallback = db.prepare(`
    INSERT INTO players (
      id, name, position, 
      puntos, partidos_jugados, 
      played_home, played_away, 
      points_home, points_away, points_last_season
    ) 
    VALUES (
      @id, @name, @position, 
      @puntos, @partidos_jugados, 
      @played_home, @played_away, 
      @points_home, @points_away, @points_last_season
    )
    ON CONFLICT(id) DO NOTHING
  `);

  return {
    // getLastTransferDate removed
    insertTransfer,
    insertBid,
    insertFinance,
    insertPorra,
    insertPlayerFallback,
  };
}
