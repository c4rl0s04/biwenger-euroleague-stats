
/**
 * Database access layer using better-sqlite3
 *
 * This module provides functions to query the SQLite database
 * that was created by the Python scraper.
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Connect to the LOCAL database
const dbPath = process.env.DB_PATH || 'data/local.db';

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath, { readonly: false }); // Allow writes for sync

// Initialize empty tables if database is new (prevents errors on first run)
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").pluck().all();
if (tables.length === 0) {
  console.log('📦 Initializing empty database schema...');
  // Create minimal tables so queries don't fail
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, icon TEXT);
    CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, position TEXT, team TEXT, puntos INTEGER, partidos_jugados INTEGER, played_home INTEGER, played_away INTEGER, points_home INTEGER, points_away INTEGER, points_last_season INTEGER, owner_id TEXT, status TEXT, price_increment INTEGER, birth_date TEXT, height INTEGER, weight INTEGER, price INTEGER);
    CREATE TABLE IF NOT EXISTS user_rounds (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, round_id INTEGER, round_name TEXT, points INTEGER, participated BOOLEAN DEFAULT 1, alineacion TEXT, UNIQUE(user_id, round_id));
    CREATE TABLE IF NOT EXISTS fichajes (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, fecha TEXT, player_id INTEGER, precio INTEGER, vendedor TEXT, comprador TEXT, UNIQUE(timestamp, player_id, vendedor, comprador, precio));
    CREATE TABLE IF NOT EXISTS lineups (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, round_id INTEGER, round_name TEXT, player_id INTEGER, is_captain BOOLEAN, role TEXT, UNIQUE(user_id, round_id, player_id));
    CREATE TABLE IF NOT EXISTS matches (id INTEGER PRIMARY KEY AUTOINCREMENT, round_id INTEGER, round_name TEXT, home_team TEXT, away_team TEXT, date DATE, status TEXT, home_score INTEGER, away_score INTEGER, UNIQUE(round_id, home_team, away_team));
    CREATE TABLE IF NOT EXISTS player_round_stats (id INTEGER PRIMARY KEY AUTOINCREMENT, player_id INTEGER, round_id INTEGER, fantasy_points INTEGER, minutes INTEGER, points INTEGER, UNIQUE(player_id, round_id));
    CREATE TABLE IF NOT EXISTS porras (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, round_id INTEGER, round_name TEXT, result TEXT, aciertos INTEGER, UNIQUE(user_id, round_id));
    CREATE TABLE IF NOT EXISTS market_values (id INTEGER PRIMARY KEY AUTOINCREMENT, player_id INTEGER, price INTEGER, date DATE);
  `);
}

/**
 * Get Market KPIs
 * @returns {Object} Market statistics
 */
export function getMarketKPIs() {
  const query = `
    SELECT 
      COUNT(*) as total_transfers,
      ROUND(AVG(precio), 2) as avg_value,
      MAX(precio) as max_value,
      MIN(precio) as min_value,
      COUNT(DISTINCT comprador) as active_buyers,
      COUNT(DISTINCT vendedor) as active_sellers
    FROM fichajes
  `;
  
  return db.prepare(query).get();
}

/**
 * Get all transfers with pagination
 * @param {number} limit - Number of results
 * @param {number} offset - Offset for pagination
 * @returns {Array} List of transfers
 */
export function getAllTransfers(limit = 100, offset = 0) {
  const query = `
    SELECT 
      id,
      fecha,
      player_id,
      precio,
      vendedor,
      comprador
    FROM fichajes
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `;
  
  return db.prepare(query).all(limit, offset);
}

/**
 * Get Porras statistics
 * @returns {Array} User statistics from prediction game
 */
export function getPorrasStats() {
  const query = `
    SELECT 
      usuario,
      COUNT(*) as total_rounds,
      SUM(aciertos) as total_hits,
      ROUND(AVG(aciertos), 2) as avg_hits,
      MAX(aciertos) as best_round,
      MIN(aciertos) as worst_round
    FROM porras
    GROUP BY usuario
    ORDER BY total_hits DESC
  `;

  return db.prepare(query).all();
}

/**
 * Get all Porras rounds
 * @returns {Array} All rounds with results
 */
export function getAllPorrasRounds() {
  const query = `
    SELECT 
      jornada,
      usuario,
      aciertos
    FROM porras
    ORDER BY jornada DESC, aciertos DESC
  `;

  return db.prepare(query).all();
}

/**
 * Get squad statistics for all users
 * @returns {Array} Squad stats per user
 */
/**
 * Get squad statistics for all users
 * @returns {Array} Squad stats per user
 */
export function getSquadStats() {
  const query = `
    SELECT 
      p.owner_id as user_id,
      COUNT(p.id) as squad_size,
      SUM(COALESCE(p.price, 0)) as total_value,
      ur.total_points
    FROM players p
    LEFT JOIN (
      SELECT user_id, SUM(points) as total_points
      FROM user_rounds
      WHERE participated = 1
      GROUP BY user_id
    ) ur ON p.owner_id = ur.user_id
    WHERE p.owner_id IS NOT NULL
    GROUP BY p.owner_id
    ORDER BY total_points DESC
  `;

  return db.prepare(query).all();
}

/**
 * Get user squad details (Current Squad)
 * @param {number} userId - User ID
 * @returns {Array} Player details
 */
export function getUserSquad(userId) {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.position,
      p.team,
      p.price,
      p.puntos as points,
      ROUND(CAST(p.puntos AS FLOAT) / NULLIF(p.partidos_jugados, 0), 1) as average,
      p.status
    FROM players p
    WHERE p.owner_id = ?
    ORDER BY p.puntos DESC
  `;

  return db.prepare(query).all(userId);
}

/**
 * Get the next upcoming round
 * @returns {Object} Next round details
 */
export function getNextRound() {
  // Find the first match in the future
  const query = `
    SELECT 
      round_id,
      round_name,
      MIN(date) as start_date
    FROM matches
    WHERE date > datetime('now')
    GROUP BY round_id
    ORDER BY date ASC
    LIMIT 1
  `;
  return db.prepare(query).get();
}

// Export db instance for custom queries if needed
export { db };

/**
 * Get top performing players
 * @param {number} limit - Number of players
 * @returns {Array} List of top players
 */
export function getTopPlayers(limit = 10) {
  const query = `
    SELECT 
      p.id, p.name, p.team, p.position, 
      p.puntos as points, 
      ROUND(CAST(p.puntos AS FLOAT) / NULLIF(p.partidos_jugados, 0), 1) as average,
      u.name as owner_name
    FROM players p
    LEFT JOIN users u ON p.owner_id = u.id
    ORDER BY p.puntos DESC 
    LIMIT ?
  `;
  return db.prepare(query).all(limit);
}

/**
 * Get recent market activity
 * @param {number} limit - Number of transfers
 * @returns {Array} Recent transfers
 */
export function getRecentTransfers(limit = 5) {
  const query = `
    SELECT 
      f.*,
      p.name as player_name,
      p.position
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    ORDER BY f.timestamp DESC
    LIMIT ?
  `;
  return db.prepare(query).all(limit);
}

/**
 * Get league standings (Latest)
 * @returns {Array} Current standings with user details
 */
export function getStandings() {
  const query = `
    WITH UserTotals AS (
      SELECT 
        user_id,
        SUM(points) as total_points
      FROM user_rounds
      WHERE participated = 1
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      COALESCE(ut.total_points, 0) as total_points,
      COALESCE(sq.team_value, 0) as team_value,
      COALESCE(sq.price_trend, 0) as price_trend,
      RANK() OVER (ORDER BY COALESCE(ut.total_points, 0) DESC) as position
    FROM users u
    LEFT JOIN UserTotals ut ON u.id = ut.user_id
    LEFT JOIN (
      SELECT 
        owner_id, 
        SUM(price) as team_value,
        SUM(price_increment) as price_trend
      FROM players
      WHERE owner_id IS NOT NULL
      GROUP BY owner_id
    ) sq ON u.id = sq.owner_id
    ORDER BY position ASC
  `;
  return db.prepare(query).all();
}

/**
 * Get the winner of the last completed round
 * @returns {Object} User who won the last round
 */
export function getLastRoundWinner() {
  const query = `
    WITH LastRound AS (
      SELECT MAX(round_id) as round_id
      FROM user_rounds
      WHERE participated = 1
    )
    SELECT 
      ur.user_id,
      u.name,
      u.icon,
      ur.points,
      ur.round_name
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.round_id = (SELECT round_id FROM LastRound)
    ORDER BY ur.points DESC
    LIMIT 1
  `;
  return db.prepare(query).get();
}

/**
 * Get market trends (Volume & Avg Price per day)
 * @returns {Array} Daily market stats
 */
export function getMarketTrends() {
  const query = `
    SELECT 
      substr(fecha, 1, 10) as date,
      COUNT(*) as count,
      ROUND(AVG(precio), 0) as avg_value
    FROM fichajes
    GROUP BY date
    ORDER BY date ASC
    LIMIT 30
  `;
  return db.prepare(query).all();
}

/**
 * Get detailed season statistics for a specific user
 * @param {string} userId - User ID
 * @returns {Object} User season statistics
 */
export function getUserSeasonStats(userId) {
  // Get basic stats
  const statsQuery = `
    WITH UserRounds AS (
      SELECT 
        user_id,
        points,
        participated
      FROM user_rounds
      WHERE user_id = ? AND participated = 1
    )
    SELECT 
      COALESCE(SUM(points), 0) as total_points,
      COALESCE(MAX(points), 0) as best_round,
      COALESCE(MIN(points), 0) as worst_round,
      COALESCE(ROUND(AVG(points), 1), 0) as average_points,
      COUNT(*) as rounds_played
    FROM UserRounds
  `;
  
  const stats = db.prepare(statsQuery).get(userId);
  
  // Calculate position per round for this user
  const positionsQuery = `
    WITH RoundPositions AS (
      SELECT 
        ur.round_id,
        ur.user_id,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE ur.participated = 1
    )
    SELECT 
      MIN(position) as best_position,
      MAX(position) as worst_position
    FROM RoundPositions
    WHERE user_id = ?
  `;
  
  const positions = db.prepare(positionsQuery).get(userId);
  
  // Get user current standing
  const standings = getStandings();
  const userStanding = standings.find(u => u.user_id === userId);
  
  return {
    ...stats,
    ...positions,
    position: userStanding?.position || 0,
    team_value: userStanding?.team_value || 0,
    price_trend: userStanding?.price_trend || 0
  };
}

/**
 * Get user's squad with price trends
 * @param {string} userId - User ID
 * @returns {Object} Squad details with trending players
 */
export function getUserSquadDetails(userId) {
  const query = `
    SELECT 
      id, name, position, team, price, price_increment, puntos as points
    FROM players
    WHERE owner_id = ?
    ORDER BY price_increment DESC
  `;
  
  const squad = db.prepare(query).all(userId);
  
  const totalValue = squad.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalTrend = squad.reduce((sum, p) => sum + (p.price_increment || 0), 0);
  
  return {
    total_value: totalValue,
    price_trend: totalTrend,
    top_rising: squad.filter(p => p.price_increment > 0).slice(0, 3),
    top_falling: squad.filter(p => p.price_increment < 0).slice(-3).reverse()
  };
}

/**
 * Get user's recent rounds performance
 * @param {string} userId - User ID
 * @param {number} limit - Number of rounds
 * @returns {Array} Recent rounds with position
 */
export function getUserRecentRounds(userId, limit = 10) {
  const query = `
    WITH RoundPositions AS (
      SELECT 
        ur.round_id,
        ur.round_name,
        ur.user_id,
        ur.points,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE ur.participated = 1
    )
    SELECT 
      round_id,
      round_name,
      points,
      position
    FROM RoundPositions
    WHERE user_id = ?
    ORDER BY round_id DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(userId, limit);
}

/**
 * Get user's captain statistics
 * @param {string} userId - User ID
 * @returns {Object} Captain stats
 */
export function getUserCaptainStats(userId) {
  // Get overall captain stats
  const overallQuery = `
    SELECT 
      COUNT(DISTINCT l.round_id) as total_rounds,
      SUM(COALESCE(prs.fantasy_points, 0)) as extra_points,
      AVG(COALESCE(prs.fantasy_points, 0)) as avg_points
    FROM lineups l
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = ? AND l.is_captain = 1
  `;
  
  const overall = db.prepare(overallQuery).get(userId);
  
  // Get ALL captains used with their stats (no limit)
  // Note: fantasy_points are the base points, NOT multiplied by 2
  const mostUsedQuery = `
    SELECT 
      p.id as player_id,
      p.name,
      COUNT(DISTINCT l.round_id) as times_captain,
      AVG(COALESCE(prs.fantasy_points, 0)) as avg_as_captain,
      SUM(COALESCE(prs.fantasy_points, 0)) as total_as_captain
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = ? AND l.is_captain = 1
    GROUP BY l.player_id, p.name
    ORDER BY times_captain DESC, avg_as_captain DESC
  `;
  
  const mostUsed = db.prepare(mostUsedQuery).all(userId);
  
  // Get best and worst captain rounds with player names
  const bestQuery = `
    SELECT 
      p.name,
      COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = ? AND l.is_captain = 1
    ORDER BY points DESC
    LIMIT 1
  `;
  
  const worstQuery = `
    SELECT 
      p.name,
      COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = ? AND l.is_captain = 1
    ORDER BY points ASC
    LIMIT 1
  `;
  
  const best = db.prepare(bestQuery).get(userId);
  const worst = db.prepare(worstQuery).get(userId);
  
  return {
    total_rounds: overall.total_rounds || 0,
    extra_points: overall.extra_points || 0,
    avg_points: overall.avg_points || 0,
    most_used: mostUsed,
    best_round: best ? { name: best.name, points: best.points } : { name: '', points: 0 },
    worst_round: worst ? { name: worst.name, points: worst.points } : { name: '', points: 0 }
  };
}

/**
 * Get comparison with league leader
 * @param {string} userId - User ID
 * @returns {Object} Leader comparison
 */
export function getLeaderComparison(userId) {
  const standings = getStandings();
  const leader = standings[0];
  const secondPlace = standings[1];
  const user = standings.find(u => u.user_id === userId);
  
  if (!user || !leader) return null;
  
  const gap = leader.total_points - user.total_points;
  const roundsNeeded = user.position > 1 
    ? Math.ceil(gap / 10) // Assuming 10pts average per round
    : 0;
  
  // If user is leader, calculate gap to second place
  const gapToSecond = (user.position === 1 && secondPlace) 
    ? user.total_points - secondPlace.total_points 
    : 0;
  
  return {
    leader_name: leader.name,
    leader_points: leader.total_points,
    user_points: user.total_points,
    gap: gap,
    gap_to_second: gapToSecond,
    rounds_needed: roundsNeeded,
    is_leader: user.position === 1
  };
}

/**
 * Get user's home/away performance
 * @param {string} userId - User ID
 * @returns {Object} Home/away stats
 */
export function getUserHomeAwayStats(userId) {
  const query = `
    SELECT 
      SUM(points_home) as total_home,
      SUM(points_away) as total_away,
      SUM(played_home) as games_home,
      SUM(played_away) as games_away
    FROM players
    WHERE owner_id = ?
  `;
  
  const stats = db.prepare(query).get(userId);
  
  return {
    total_home: stats.total_home || 0,
    total_away: stats.total_away || 0,
    avg_home: stats.games_home > 0 ? Math.round(stats.total_home / stats.games_home) : 0,
    avg_away: stats.games_away > 0 ? Math.round(stats.total_away / stats.games_away) : 0,
    difference_pct: stats.total_home > 0 && stats.total_away > 0
      ? Math.round(((stats.total_home - stats.total_away) / stats.total_away) * 100)
      : 0
  };
}

/**
 * Get league average points per round
 * @returns {number} Average points
 */
export function getLeagueAveragePoints() {
  const query = `
    SELECT ROUND(AVG(points), 1) as avg_points
    FROM user_rounds
    WHERE participated = 1
  `;
  
  const result = db.prepare(query).get();
  return result.avg_points || 0;
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
      SELECT prs.* 
      FROM player_round_stats prs
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
 * Get captain recommendations based on form and upcoming matches
 * @param {string} userId - User ID to get recommendations for
 * @param {number} limit - Number of recommendations
 * @returns {Array} List of recommended captain picks
 */
export function getCaptainRecommendations(userId, limit = 3) {
  // Get user's squad players with their recent form
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      ORDER BY round_id DESC
      LIMIT 3
    ),
    RoundCount AS (
      SELECT COUNT(*) as total_rounds FROM RecentRounds
    ),
    OrderedStats AS (
      SELECT prs.* 
      FROM player_round_stats prs
      WHERE prs.round_id IN (SELECT round_id FROM RecentRounds)
      ORDER BY prs.round_id DESC
    ),
    UserSquadForm AS (
      SELECT 
        p.id as player_id,
        p.name,
        p.position,
        p.team,
        COALESCE(SUM(os.fantasy_points), 0) * 1.0 / (SELECT total_rounds FROM RoundCount) as avg_recent_points,
        COUNT(os.id) as recent_games,
        GROUP_CONCAT(os.fantasy_points) as recent_scores
      FROM players p
      LEFT JOIN OrderedStats os ON p.id = os.player_id 
      WHERE p.owner_id = ?
      GROUP BY p.id, p.name, p.position, p.team
    )
    SELECT 
      player_id,
      name,
      position,
      team,
      avg_recent_points,
      recent_games,
      recent_scores,
      CASE 
        WHEN avg_recent_points >= 25 THEN 'Excelente forma'
        WHEN avg_recent_points >= 18 THEN 'Buena forma'
        WHEN avg_recent_points >= 12 THEN 'Forma regular'
        ELSE 'Forma baja'
      END as form_label
    FROM UserSquadForm
    WHERE avg_recent_points > 0
    ORDER BY avg_recent_points DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(userId, limit);
}

/**
 * Get market opportunities (undervalued players with good form)
 * @param {number} limit - Number of opportunities to return
 * @returns {Array} List of recommended buys
 */
export function getMarketOpportunities(limit = 3) {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      ORDER BY round_id DESC
      LIMIT 3
    ),
    RoundCount AS (
      SELECT COUNT(*) as total_rounds FROM RecentRounds
    ),
    OrderedStats AS (
      SELECT prs.* 
      FROM player_round_stats prs
      WHERE prs.round_id IN (SELECT round_id FROM RecentRounds)
      ORDER BY prs.round_id DESC
    ),
    PlayerForm AS (
      SELECT 
        os.player_id,
        SUM(os.fantasy_points) * 1.0 / (SELECT total_rounds FROM RoundCount) as avg_recent_points,
        GROUP_CONCAT(os.fantasy_points) as recent_scores
      FROM OrderedStats os
      GROUP BY os.player_id
      HAVING COUNT(*) >= 2
    )
    SELECT 
      p.id as player_id,
      p.name,
      p.position,
      p.team,
      p.price,
      COALESCE(p.price_increment, 0) as price_trend,
      COALESCE(pf.avg_recent_points, 0) as avg_recent_points,
      pf.recent_scores,
      ROUND(COALESCE(pf.avg_recent_points, 0) * 1000000.0 / NULLIF(p.price, 0), 2) as value_score
    FROM players p
    LEFT JOIN PlayerForm pf ON p.id = pf.player_id
    WHERE p.owner_id IS NULL
      AND p.price > 0
      AND pf.avg_recent_points >= 12
    ORDER BY value_score DESC, price_trend DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(limit);
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

  // Get recent matches
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
  
  return { ...player, recentMatches };
}

/**
 * Get significant price changes in the last period
 * @param {number} hoursAgo - Hours to look back
 * @param {number} minChange - Minimum price change threshold
 * @returns {Array} Players with significant price changes
 */
export function getSignificantPriceChanges(hoursAgo = 24, minChange = 500000) {
  // Since we don't have historical price tracking with timestamps,
  // we'll use price_increment as a proxy for recent changes
  const query = `
    SELECT 
      id as player_id,
      name,
      position,
      team,
      price,
      price_increment,
      owner_id
    FROM players
    WHERE ABS(COALESCE(price_increment, 0)) >= ?
    ORDER BY ABS(price_increment) DESC
    LIMIT 5
  `;
  
  return db.prepare(query).all(minChange);
}

/**
 * Get recent records broken
 * @returns {Array} Recent league records
 */
export function getRecentRecords() {
  const records = [];
  
  // Highest round score
  const highestRoundQuery = `
    SELECT 
      ur.user_id,
      u.name as user_name,
      ur.round_name,
      ur.points
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.participated = 1
    ORDER BY ur.points DESC
    LIMIT 1
  `;
  const highestRound = db.prepare(highestRoundQuery).get();
  if (highestRound) {
    records.push({
      type: 'highest_round',
      label: 'Récord de puntos en jornada',
      description: `${highestRound.user_name} - ${highestRound.points} pts en ${highestRound.round_name}`,
      user_name: highestRound.user_name,
      value: highestRound.points
    });
  }
  
  // Highest transfer price
  const highestTransferQuery = `
    SELECT 
      f.precio,
      p.name as player_name,
      f.comprador,
      f.fecha
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    ORDER BY f.precio DESC
    LIMIT 1
  `;
  const highestTransfer = db.prepare(highestTransferQuery).get();
  if (highestTransfer) {
    records.push({
      type: 'highest_transfer',
      label: 'Fichaje más caro',
      description: `${highestTransfer.player_name} - ${(highestTransfer.precio / 1000000).toFixed(2)}M€ (${highestTransfer.comprador})`,
      user_name: highestTransfer.comprador,
      value: highestTransfer.precio
    });
  }
  
  // Biggest price gain
  const biggestGainQuery = `
    SELECT 
      id,
      name,
      price_increment,
      owner_id
    FROM players
    WHERE price_increment > 0
    ORDER BY price_increment DESC
    LIMIT 1
  `;
  const biggestGain = db.prepare(biggestGainQuery).get();
  if (biggestGain && biggestGain.price_increment > 0) {
    records.push({
      type: 'biggest_gain',
      label: 'Mayor revalorización',
      description: `${biggestGain.name} +${(biggestGain.price_increment / 1000000).toFixed(2)}M€`,
      player_name: biggestGain.name,
      value: biggestGain.price_increment
    });
  }
  
  return records.slice(0, 3);
}

/**
 * Get personalized alerts for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of alerts
 * @returns {Array} Personalized alerts
 */
export function getPersonalizedAlerts(userId, limit = 5) {
  const alerts = [];
  
  // Check for players with significant price increases
  const priceGainsQuery = `
    SELECT 
      name,
      price_increment
    FROM players
    WHERE owner_id = ? AND price_increment > 500000
    ORDER BY price_increment DESC
    LIMIT 2
  `;
  const priceGains = db.prepare(priceGainsQuery).all(userId);
  priceGains.forEach(player => {
    alerts.push({
      type: 'price_gain',
      icon: '📈',
      message: `Tu jugador ${player.name} ha ganado ${(player.price_increment / 1000000).toFixed(2)}M€`,
      severity: 'success'
    });
  });
  
  // Check for players with significant price decreases
  const priceLossesQuery = `
    SELECT 
      name,
      price_increment
    FROM players
    WHERE owner_id = ? AND price_increment < -500000
    ORDER BY price_increment ASC
    LIMIT 2
  `;
  const priceLosses = db.prepare(priceLossesQuery).all(userId);
  priceLosses.forEach(player => {
    alerts.push({
      type: 'price_loss',
      icon: '📉',
      message: `Tu jugador ${player.name} ha perdido ${Math.abs(player.price_increment / 1000000).toFixed(2)}M€`,
      severity: 'warning'
    });
  });
  
  // Check for recent good performance
  const recentGoodFormQuery = `
    WITH LastRound AS (
      SELECT MAX(round_id) as max_round
      FROM player_round_stats
    )
    SELECT 
      p.name,
      prs.fantasy_points
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    WHERE p.owner_id = ? 
      AND prs.round_id = (SELECT max_round FROM LastRound)
      AND prs.fantasy_points >= 25
    ORDER BY prs.fantasy_points DESC
    LIMIT 1
  `;
  const goodForm = db.prepare(recentGoodFormQuery).get(userId);
  if (goodForm) {
    alerts.push({
      type: 'good_performance',
      icon: '⭐',
      message: `¡${goodForm.name} brilló con ${goodForm.fantasy_points} puntos!`,
      severity: 'info'
    });
  }
  
  return alerts.slice(0, limit);
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
 * Get best performers from the last completed round
 * @param {number} limit - Number of MVPs
 * @returns {Array} Top MVPs from last round
 */
export function getLastRoundMVPs(limit = 5) {
  const query = `
    WITH LastRound AS (
      SELECT MAX(round_id) as last_round_id
      FROM player_round_stats
    )
    SELECT 
      prs.player_id,
      p.name,
      p.team,
      p.position,
      prs.fantasy_points as points,
      u.name as owner_name
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE prs.round_id = (SELECT last_round_id FROM LastRound)
    ORDER BY prs.fantasy_points DESC
    LIMIT ?
  `;
  
  return db.prepare(query).all(limit);
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
