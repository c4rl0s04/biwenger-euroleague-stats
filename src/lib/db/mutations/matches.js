/**
 * Match & Round Mutations
 * Handles Write operations for matches, rounds, and legacy cleanup tasks.
 */

/**
 * Prepares Statements for Match Mutations
 * @param {import('better-sqlite3').Database} db
 * @returns {{
 *   getMappedTeams: import('better-sqlite3').Statement,
 *   upsertMatch: import('better-sqlite3').Statement,
 *   findDuplicateRounds: import('better-sqlite3').Statement,
 *   deleteMatchesByRound: import('better-sqlite3').Statement,
 *   deleteConflictingStats: import('better-sqlite3').Statement,
 *   updateStatsRound: import('better-sqlite3').Statement,
 *   mergeUserRoundPoints: import('better-sqlite3').Statement,
 *   deleteUserRounds: import('better-sqlite3').Statement,
 *   deleteLineups: import('better-sqlite3').Statement
 * }}
 */
export function prepareMatchMutations(db) {
  // --- Sync Matches ---

  const getMappedTeams = db.prepare('SELECT id, code, name FROM teams WHERE code IS NOT NULL');

  const upsertMatch = db.prepare(`
    INSERT INTO matches (
      round_id, round_name, home_id, away_id, date, status, 
      home_score, away_score, home_score_regtime, away_score_regtime,
      home_q1, away_q1, home_q2, away_q2, home_q3, away_q3, home_q4, away_q4, home_ot, away_ot
    )
    VALUES (
      @round_id, @round_name, @home_id, @away_id, @date, @status, 
      @home_score, @away_score, @home_score_regtime, @away_score_regtime,
      @home_q1, @away_q1, @home_q2, @away_q2, @home_q3, @away_q3, @home_q4, @away_q4, @home_ot, @away_ot
    )
    ON CONFLICT(round_id, home_id, away_id) DO UPDATE SET
      round_name=excluded.round_name,
      status=excluded.status,
      home_score=excluded.home_score,
      away_score=excluded.away_score,
      home_score_regtime=excluded.home_score_regtime,
      away_score_regtime=excluded.away_score_regtime,
      home_q1=excluded.home_q1,
      away_q1=excluded.away_q1,
      home_q2=excluded.home_q2,
      away_q2=excluded.away_q2,
      home_q3=excluded.home_q3,
      away_q3=excluded.away_q3,
      home_q4=excluded.home_q4,
      away_q4=excluded.away_q4,
      home_ot=excluded.home_ot,
      away_ot=excluded.away_ot,
      date=excluded.date
  `);

  // --- Round Cleanup (Merging duplicates) ---

  const findDuplicateRounds = db.prepare(`
    SELECT 
      CASE 
        WHEN round_name LIKE '%(aplazada)%' THEN TRIM(REPLACE(round_name, '(aplazada)', ''))
        ELSE round_name
      END as base_name,
      GROUP_CONCAT(DISTINCT round_id) as round_ids,
      MIN(round_id) as canonical_id,
      COUNT(DISTINCT round_id) as count
    FROM matches
    GROUP BY base_name
    HAVING count > 1
  `);

  const deleteMatchesByRound = db.prepare('DELETE FROM matches WHERE round_id = ?');

  const deleteConflictingStats = db.prepare(`
    DELETE FROM player_round_stats 
    WHERE round_id = ? 
    AND player_id IN (
      SELECT player_id FROM player_round_stats WHERE round_id = ?
    )
  `);

  const updateStatsRound = db.prepare(`
    UPDATE player_round_stats SET round_id = ?
    WHERE round_id = ?
  `);

  const mergeUserRoundPoints = db.prepare(`
    UPDATE user_rounds 
    SET points = points + COALESCE((
      SELECT points FROM user_rounds ur2 
      WHERE ur2.user_id = user_rounds.user_id AND ur2.round_id = ?
    ), 0)
    WHERE round_id = ?
  `);

  const deleteUserRounds = db.prepare('DELETE FROM user_rounds WHERE round_id = ?');

  const deleteLineups = db.prepare('DELETE FROM lineups WHERE round_id = ?');

  return {
    getMappedTeams,
    upsertMatch,

    // Cleanup Logic
    findDuplicateRounds,
    deleteMatchesByRound,
    deleteConflictingStats,
    updateStatsRound,
    mergeUserRoundPoints,
    deleteUserRounds,
    deleteLineups,
  };
}
