/**
 * Shared JSDoc Type Definitions for Database Queries
 * Import these types in query files for consistent documentation
 *
 * @fileoverview Type definitions for the Biwenger Stats database layer
 */

// ============ USER TYPES ============

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} name - Display name
 * @property {string} icon - Avatar URL
 */

/**
 * @typedef {Object} UserStanding
 * @property {number} user_id - User ID
 * @property {string} name - Display name
 * @property {string} icon - Avatar URL
 * @property {number} total_points - Cumulative points
 * @property {number} rounds_played - Number of rounds participated
 * @property {number} avg_points - Average points per round
 * @property {number} best_round - Highest single round score
 * @property {number} worst_round - Lowest single round score
 * @property {number} round_wins - Times finished first in round
 * @property {number} team_value - Current squad market value
 * @property {number} price_trend - Recent price movement
 * @property {number} position - Current league position
 */

/**
 * @typedef {Object} UserSeasonStats
 * @property {number} total_points - Total season points
 * @property {number} best_round - Best round score
 * @property {number} worst_round - Worst round score
 * @property {number} average_points - Average per round
 * @property {number} rounds_played - Games participated
 * @property {number} position - League position
 * @property {number} team_value - Squad value
 */

// ============ PLAYER TYPES ============

/**
 * @typedef {Object} Player
 * @property {number} id - Player ID
 * @property {string} name - Player name
 * @property {number} position - Position code (1=Base, 2=Alero, 3=Pivot, 4/5=Coach)
 * @property {string} team - Team name
 * @property {number} price - Current market price
 * @property {number} price_increment - Recent price change
 * @property {number} puntos - Total fantasy points
 * @property {number|null} owner_id - Owner user ID or null if free
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} player_id - Player ID
 * @property {string} name - Player name
 * @property {number} avg_points - Average fantasy points
 * @property {number} total_points - Total fantasy points
 * @property {number} games_played - Games played
 * @property {string} team - Team name
 */

/**
 * @typedef {Object} PlayerRoundStats
 * @property {number} round_id - Round ID
 * @property {number} player_id - Player ID
 * @property {number} fantasy_points - Fantasy points scored
 * @property {number} minutes - Minutes played
 * @property {number} points - Real game points
 * @property {number} assists - Assists
 * @property {number} rebounds - Rebounds
 */

// ============ ROUND TYPES ============

/**
 * @typedef {Object} Round
 * @property {number} id - Round ID
 * @property {string} name - Round name (e.g., "Jornada 10")
 * @property {string} status - Round status (pending, active, finished)
 */

/**
 * @typedef {Object} RoundWinner
 * @property {number} round_id - Round ID
 * @property {string} round_name - Round name
 * @property {number} user_id - Winner user ID
 * @property {string} name - Winner display name
 * @property {string} icon - Winner avatar
 * @property {number} points - Points scored
 */

// ============ MARKET TYPES ============

/**
 * @typedef {Object} Transfer
 * @property {number} id - Transfer ID
 * @property {number} player_id - Player ID
 * @property {string} player_name - Player name
 * @property {number} from_user_id - Seller ID
 * @property {string} from_user_name - Seller name
 * @property {number} to_user_id - Buyer ID
 * @property {string} to_user_name - Buyer name
 * @property {number} amount - Transfer fee
 * @property {number} timestamp - Unix timestamp
 */

/**
 * @typedef {Object} MarketActivity
 * @property {Array<Transfer>} transfers - Recent transfers
 * @property {number} total_value - Total market movement
 * @property {number} avg_price - Average transfer price
 */

// ============ PERFORMANCE TYPES ============

/**
 * @typedef {Object} StreakData
 * @property {number} user_id - User ID
 * @property {string} name - User name
 * @property {string} icon - User avatar
 * @property {number} streak - Current streak count
 * @property {string} type - Streak type (hot/cold)
 */

/**
 * @typedef {Object} VolatilityData
 * @property {number} user_id - User ID
 * @property {string} name - User name
 * @property {number} std_dev - Standard deviation of scores
 * @property {number} consistency_score - Consistency rating (0-100)
 */

// ============ ANALYTICS TYPES ============

/**
 * @typedef {Object} LeagueTotals
 * @property {number} total_points - All points scored
 * @property {number} avg_round_points - Average per round
 * @property {number} total_rounds - Rounds completed
 * @property {number} total_users - Participant count
 * @property {number} total_league_value - Combined squad values
 */

/**
 * @typedef {Object} PointsProgression
 * @property {number} user_id - User ID
 * @property {string} name - User name
 * @property {number} round_id - Round ID
 * @property {string} round_name - Round name
 * @property {number} points - Points this round
 * @property {number} cumulative_points - Running total
 */

export const TYPES_VERSION = '1.0.0';
