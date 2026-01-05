/**
 * Player Mutations
 * Handles Write operations for users, players, and teams tables.
 * Used by sync scripts.
 */

/**
 * Prepares Statements for Player Mutations
 * @param {import('better-sqlite3').Database} db
 */
export function preparePlayerMutations(db) {
  // Insert/Update Player Core Data
  const upsertPlayer = db.prepare(`
    INSERT INTO players (
      id, name, team_id, position, 
      puntos, partidos_jugados, 
      played_home, played_away, 
      points_home, points_away, points_last_season,
      status, price_increment, price, img
    ) 
    VALUES (
      @id, @name, @team_id, @position, 
      @puntos, @partidos_jugados, 
      @played_home, @played_away, 
      @points_home, @points_away, 
      @points_last_season,
      @status, @price_increment, @price, @img
    )
    ON CONFLICT(id) DO UPDATE SET 
      name=excluded.name, 
      team_id=excluded.team_id,
      position=excluded.position,
      puntos=excluded.puntos,
      partidos_jugados=excluded.partidos_jugados,
      played_home=excluded.played_home,
      played_away=excluded.played_away,
      points_home=excluded.points_home,
      points_away=excluded.points_away,
      points_last_season=excluded.points_last_season,
      status=excluded.status,
      price_increment=excluded.price_increment,
      price=excluded.price
  `);

  // Update bio data fetched from details API
  const updatePlayerDetails = db.prepare(`
    UPDATE players 
    SET birth_date = @birth_date, height = @height, weight = @weight
    WHERE id = @id
  `);

  // Insert Market Value History
  const insertMarketValue = db.prepare(`
    INSERT OR IGNORE INTO market_values (player_id, price, date)
    VALUES (@player_id, @price, @date)
  `);

  // Get Last Market Value Date (for incremental sync)
  const getLastDate = db.prepare(
    'SELECT max(date) as last_date FROM market_values WHERE player_id = ?'
  );

  // Check for missing bio data (for self-healing sync)
  const getPlayerBioStatus = db.prepare(
    'SELECT birth_date, height, weight FROM players WHERE id = ?'
  );

  // Insert/Update Team (for Team Sync)
  const upsertTeam = db.prepare(`
    INSERT INTO teams (id, name, short_name, img) VALUES (@id, @name, @short_name, @img)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, short_name=excluded.short_name, img=excluded.img
  `);

  return {
    upsertPlayer: (params) => upsertPlayer.run(params),
    updatePlayerDetails: (params) => updatePlayerDetails.run(params),
    insertMarketValue: (params) => insertMarketValue.run(params),
    getLastDate: (playerId) => getLastDate.get(playerId),
    getPlayerBioStatus: (playerId) => getPlayerBioStatus.get(playerId),
    upsertTeam: (params) => upsertTeam.run(params),
    // Expose raw statements if needed for bulk transactions
    stmts: {
      insertMarketValue,
      upsertTeam,
    },
  };
}
