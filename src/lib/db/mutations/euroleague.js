/**
 * EuroLeague Mutations
 * Handles Write operations for EuroLeague master data, linkage, and statistics.
 */

/**
 * Prepares Statements for Euroleague Mutations
 * @param {import('better-sqlite3').Database} db
 * @returns {{
 *   upsertSyncMeta: import('better-sqlite3').Statement,
 *   updateTeamMaster: import('better-sqlite3').Statement,
 *   updateTeamCode: import('better-sqlite3').Statement,
 *   getDbTeams: import('better-sqlite3').Statement,
 *   updatePlayerLink: import('better-sqlite3').Statement,
 *   insertPlayerMapping: import('better-sqlite3').Statement,
 *   getBiwengerPlayers: import('better-sqlite3').Statement,
 *   getPlayerByEuroleagueCode: import('better-sqlite3').Statement,
 *   getAllPlayers: import('better-sqlite3').Statement,
 *   updatePlayerEuroleagueCode: import('better-sqlite3').Statement,
 *   insertPlayerStats: import('better-sqlite3').Statement,
 *   updateFantasyPoints: import('better-sqlite3').Statement,
 *   checkFinishedMatch: import('better-sqlite3').Statement,
 *   checkStatsExist: import('better-sqlite3').Statement
 * }}
 */
export function prepareEuroleagueMutations(db) {
  // --- Master Data (Teams/Mappings) ---

  const upsertSyncMeta = db.prepare(`
    INSERT INTO sync_meta (key, value, updated_at) VALUES (@key, @value, @updated_at)
    ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = @updated_at
  `);

  const updateTeamMaster = db.prepare(`
    UPDATE teams 
    SET code = @code, name = @name, short_name = @short_name
    WHERE name LIKE @fuzzy_name OR short_name = @short_name
  `);

  const updateTeamCode = db.prepare('UPDATE teams SET code = ?, short_name = ? WHERE id = ?');
  
  const getDbTeams = db.prepare('SELECT id, name FROM teams');

  const updatePlayerLink = db.prepare(`
    UPDATE players
    SET 
        euroleague_code = @el_code,
        height = @height,
        weight = @weight,
        birth_date = @birth_date,
        position = @position,
        dorsal = @dorsal,
        country = @country
    WHERE id = @biwenger_id
  `);

  const insertPlayerMapping = db.prepare(`
    INSERT OR REPLACE INTO player_mappings (biwenger_id, euroleague_code, details_json)
    VALUES (@biwenger_id, @el_code, @json)
  `);

  const getBiwengerPlayers = db.prepare('SELECT id, name, team_id FROM players');

  // --- Stats Sync ---

  const getPlayerByEuroleagueCode = db.prepare(
    'SELECT id, name FROM players WHERE euroleague_code = ?'
  );

  const getAllPlayers = db.prepare('SELECT id, name, team FROM players');

  const updatePlayerEuroleagueCode = db.prepare(
    'UPDATE players SET euroleague_code = @euroleague_code WHERE id = @id'
  );

  const insertPlayerStats = db.prepare(`
    INSERT INTO player_round_stats (
      player_id, round_id, fantasy_points, minutes, points,
      two_points_made, two_points_attempted,
      three_points_made, three_points_attempted,
      free_throws_made, free_throws_attempted,
      rebounds, assists, steals, blocks, turnovers, fouls_committed, valuation
    ) VALUES (
      @player_id, @round_id, @fantasy_points, @minutes, @points,
      @two_points_made, @two_points_attempted,
      @three_points_made, @three_points_attempted,
      @free_throws_made, @free_throws_attempted,
      @rebounds, @assists, @steals, @blocks, @turnovers, @fouls_committed, @valuation
    )
    ON CONFLICT(player_id, round_id) DO UPDATE SET
      minutes=excluded.minutes,
      points=excluded.points,
      two_points_made=excluded.two_points_made,
      two_points_attempted=excluded.two_points_attempted,
      three_points_made=excluded.three_points_made,
      three_points_attempted=excluded.three_points_attempted,
      free_throws_made=excluded.free_throws_made,
      free_throws_attempted=excluded.free_throws_attempted,
      rebounds=excluded.rebounds,
      assists=excluded.assists,
      steals=excluded.steals,
      blocks=excluded.blocks,
      turnovers=excluded.turnovers,
      fouls_committed=excluded.fouls_committed,
      valuation=excluded.valuation
  `);

  // --- Fantasy Points Sync ---
  const updateFantasyPoints = db.prepare(`
      UPDATE player_round_stats 
      SET fantasy_points = @fantasy_points 
      WHERE player_id = @player_id AND round_id = @round_id
  `);
  
  // Helpers
  const checkFinishedMatch = db.prepare('SELECT status FROM matches WHERE round_id = ? AND (home_team = ? OR away_team = ?)');
  const checkStatsExist = db.prepare('SELECT COUNT(*) as c FROM player_round_stats WHERE round_id = ?');

  return {
    upsertSyncMeta,
    updateTeamMaster,
    updateTeamCode, // Specific for direct ID update
    getDbTeams,
    updatePlayerLink,
    insertPlayerMapping,
    getBiwengerPlayers,
    
    // Stats related
    getPlayerByEuroleagueCode,
    getAllPlayers,
    updatePlayerEuroleagueCode,
    insertPlayerStats,
    
    // Fantasy Update
    updateFantasyPoints,

    // Helpers
    checkFinishedMatch,
    checkStatsExist,
  };
}
