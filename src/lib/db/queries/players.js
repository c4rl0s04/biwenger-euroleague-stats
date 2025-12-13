import { db } from '../client.js';

/**
 * Get top performing players
 * @param {number} limit - Number of players
 * @returns {Array} List of top players
 */
export function getTopPlayers(limit = 10) {
  const query = `
    WITH RecentScores AS (
      SELECT 
        player_id,
        GROUP_CONCAT(fantasy_points) as recent_scores
      FROM (
        SELECT player_id, fantasy_points
        FROM player_round_stats
        ORDER BY round_id DESC
      )
      GROUP BY player_id
    )
    SELECT 
      p.id, p.name, p.team, p.position, p.price,
      p.puntos as points, 
      ROUND(CAST(p.puntos AS FLOAT) / NULLIF(p.partidos_jugados, 0), 1) as average,
      u.name as owner_name,
      rs.recent_scores
    FROM players p
    LEFT JOIN users u ON p.owner_id = u.id
    LEFT JOIN RecentScores rs ON p.id = rs.player_id
    ORDER BY p.puntos DESC 
    LIMIT ?
  `;
  return db.prepare(query).all(limit);
}

/**
 * Get top players by recent form (last N rounds)
 * @param {number} limit - Number of players to return
 * @param {number} rounds - Number of recent rounds to analyze
 * @returns {Array} List of top performing players by form
 */
export function getTopPlayersByForm(limit = 5, rounds = 3) {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      ORDER BY round_id DESC
      LIMIT ?
    ),
    RoundCount AS (
      SELECT COUNT(*) as total_rounds FROM RecentRounds
    ),
    OrderedStats AS (
      SELECT prs.* FROM player_round_stats prs
      WHERE prs.round_id IN (SELECT round_id FROM RecentRounds)
      ORDER BY prs.round_id DESC
    ),
    PlayerFormStats AS (
      SELECT 
        os.player_id,
        p.name,
        p.position,
        p.team,
        u.name as owner_name,
        SUM(os.fantasy_points) as total_points,
        ROUND(SUM(os.fantasy_points) * 1.0 / (SELECT total_rounds FROM RoundCount), 1) as avg_points,
        COUNT(*) as games_played,
        GROUP_CONCAT(os.fantasy_points) as recent_scores
      FROM OrderedStats os
      JOIN players p ON os.player_id = p.id
      LEFT JOIN users u ON p.owner_id = u.id
      GROUP BY os.player_id, p.name, p.position, p.team, u.name
      HAVING games_played >= 2
    )
    SELECT 
      player_id,
      name,
      position,
      team,
      owner_name,
      total_points,
      avg_points,
      games_played,
      recent_scores
    FROM PlayerFormStats
    ORDER BY avg_points DESC, total_points DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(rounds, limit);
}

/**
 * Get detailed player information by ID
 * @param {number} playerId - Player ID
 * @returns {Object} Player details including stats
 */
export function getPlayerDetails(playerId) {
  const query = `
    SELECT 
      p.*,
      u.name as owner_name,
      (SELECT COUNT(*) FROM player_round_stats WHERE player_id = p.id) as games_played,
      (SELECT ROUND(AVG(fantasy_points), 1) FROM player_round_stats WHERE player_id = p.id) as season_avg,
      (SELECT SUM(fantasy_points) FROM player_round_stats WHERE player_id = p.id) as total_points
    FROM players p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `;
  
  const player = db.prepare(query).get(playerId);
  
  if (!player) return null;

  const matchesQuery = `
    SELECT 
      prs.round_id,
      (SELECT round_name FROM matches WHERE round_id = prs.round_id LIMIT 1) as round_name,
      prs.fantasy_points,
      prs.minutes as minutes_played,
      prs.points as points_scored,
      prs.rebounds,
      prs.three_points_made as triples,
      prs.assists,
      prs.steals
    FROM player_round_stats prs
    WHERE prs.player_id = ?
    ORDER BY prs.round_id DESC
  `;
  
  const recentMatches = db.prepare(matchesQuery).all(playerId);
  
  return {
    ...player,
    recentMatches
  };
}

/**
 * Get players with birthdays today
 * @returns {Array} Players celebrating birthdays
 */
export function getPlayersBirthday() {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.team,
      p.position,
      p.birth_date,
      u.name as owner_name
    FROM players p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.birth_date IS NOT NULL
      AND strftime('%m-%d', p.birth_date) = strftime('%m-%d', 'now')
    ORDER BY p.name
  `;
  
  return db.prepare(query).all();
}

/**
 * Get players on hot or cold streaks
 * @param {number} minGames - Minimum games for streak
 * @returns {Object} Hot and cold players
 */
export function getPlayerStreaks(minGames = 3) {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      ORDER BY round_id DESC
      LIMIT 5
    ),
    PlayerRecentForm AS (
      SELECT 
        prs.player_id,
        p.name,
        p.team,
        p.position,
        COUNT(*) as games,
        AVG(prs.fantasy_points) as recent_avg,
        u.name as owner_name
      FROM player_round_stats prs
      JOIN players p ON prs.player_id = p.id
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE prs.round_id IN (SELECT round_id FROM RecentRounds)
      GROUP BY prs.player_id, p.name, p.team, p.position, u.name
      HAVING games >= ?
    ),
    SeasonAvg AS (
      SELECT 
        player_id,
        AVG(fantasy_points) as season_avg
      FROM player_round_stats
      GROUP BY player_id
    )
    SELECT 
      prf.player_id,
      prf.name,
      prf.team,
      prf.position,
      prf.games,
      prf.recent_avg,
      prf.owner_name,
      COALESCE(sa.season_avg, 0) as season_avg,
      ROUND((prf.recent_avg - COALESCE(sa.season_avg, 0)) / NULLIF(sa.season_avg, 1) * 100, 1) as trend_pct
    FROM PlayerRecentForm prf
    LEFT JOIN SeasonAvg sa ON prf.player_id = sa.player_id
    ORDER BY ABS(prf.recent_avg - COALESCE(sa.season_avg, 0)) DESC
    LIMIT 20
  `;
  
  const allPlayers = db.prepare(query).all(minGames);
  
  return {
    hot: allPlayers.filter(p => p.trend_pct > 20).slice(0, 5),
    cold: allPlayers.filter(p => p.trend_pct < -20).slice(0, 5)
  };
}

/**
 * Get players showing improvement trend
 * @param {number} limit - Number of rising stars
 * @returns {Array} Players with improving performance
 */
export function getRisingStars(limit = 5) {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      ORDER BY round_id DESC
      LIMIT 5
    ),
    EarlierRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      WHERE round_id NOT IN (SELECT round_id FROM RecentRounds)
      ORDER BY round_id DESC
      LIMIT 5
    ),
    RecentPerformance AS (
      SELECT 
        player_id,
        AVG(fantasy_points) as recent_avg,
        COUNT(*) as recent_games
      FROM player_round_stats
      WHERE round_id IN (SELECT round_id FROM RecentRounds)
      GROUP BY player_id
      HAVING recent_games >= 3
    ),
    EarlierPerformance AS (
      SELECT 
        player_id,
        AVG(fantasy_points) as earlier_avg
      FROM player_round_stats
      WHERE round_id IN (SELECT round_id FROM EarlierRounds)
      GROUP BY player_id
    )
    SELECT 
      p.id as player_id,
      p.name,
      p.team,
      p.position,
      rp.recent_avg,
      COALESCE(ep.earlier_avg, 0) as earlier_avg,
      ROUND(rp.recent_avg - COALESCE(ep.earlier_avg, 0), 1) as improvement,
      ROUND((rp.recent_avg - COALESCE(ep.earlier_avg, 0)) / NULLIF(ep.earlier_avg, 1) * 100, 1) as improvement_pct,
      u.name as owner_name
    FROM RecentPerformance rp
    JOIN players p ON rp.player_id = p.id
    LEFT JOIN EarlierPerformance ep ON rp.player_id = ep.player_id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE rp.recent_avg > COALESCE(ep.earlier_avg, 0)
      AND (rp.recent_avg - COALESCE(ep.earlier_avg, 0)) >= 3
    ORDER BY improvement DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(limit);
}
