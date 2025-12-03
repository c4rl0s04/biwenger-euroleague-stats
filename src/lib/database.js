
/**
 * Database access layer using better-sqlite3
 *
 * This module provides functions to query the SQLite database
 * that was created by the Python scraper.
 */

import Database from 'better-sqlite3';

// Connect to the LOCAL database
const dbPath = process.env.DB_PATH || 'data/local.db';
const db = new Database(dbPath, { readonly: false }); // Allow writes for sync

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
      id, name, team, position, 
      puntos as points, 
      ROUND(CAST(puntos AS FLOAT) / NULLIF(partidos_jugados, 0), 1) as average
    FROM players 
    ORDER BY puntos DESC 
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
  
  // Get most used captains with their stats
  const mostUsedQuery = `
    SELECT 
      p.name,
      COUNT(DISTINCT l.round_id) as times_captain,
      AVG(COALESCE(prs.fantasy_points, 0)) as avg_as_captain
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = ? AND l.is_captain = 1
    GROUP BY l.player_id, p.name
    ORDER BY times_captain DESC, avg_as_captain DESC
    LIMIT 3
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
  const user = standings.find(u => u.user_id === userId);
  
  if (!user || !leader) return null;
  
  const gap = leader.total_points - user.total_points;
  const roundsNeeded = user.position > 1 
    ? Math.ceil(gap / 10) // Assuming 10pts average per round
    : 0;
  
  return {
    leader_name: leader.name,
    leader_points: leader.total_points,
    user_points: user.total_points,
    gap: gap,
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
