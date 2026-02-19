/**
 * Shared TypeScript definitions for Database Queries
 * Import these types in query files for consistent documentation
 *
 * @fileoverview Type definitions for the Biwenger Stats database layer
 */

// ============ USER TYPES ============

export interface User {
  id: number;
  name: string;
  icon: string;
}

export interface UserStanding {
  user_id: number;
  name: string;
  icon: string;
  total_points: number;
  rounds_played: number;
  avg_points: number;
  best_round: number;
  worst_round: number;
  round_wins: number;
  team_value: number;
  price_trend: number;
  position: number;
}

export interface UserSeasonStats {
  total_points: number;
  best_round: number;
  worst_round: number;
  average_points: number;
  rounds_played: number;
  position: number;
  team_value: number;
}

// ============ PLAYER TYPES ============

export interface Player {
  id: number;
  name: string;
  position: number; // Position code (1=Base, 2=Alero, 3=Pivot, 4/5=Coach)
  team: string;
  price: number;
  price_increment: number;
  puntos: number;
  owner_id: number | null;
}

export interface PlayerStats {
  player_id: number;
  name: string;
  avg_points: number;
  total_points: number;
  games_played: number;
  team: string;
}

export interface PlayerRoundStats {
  round_id: number;
  player_id: number;
  fantasy_points: number;
  minutes: number;
  points: number;
  assists: number;
  rebounds: number;
}

// ============ ROUND TYPES ============

export interface Round {
  id: number;
  name: string;
  status: string; // pending, active, finished
}

export interface RoundWinner {
  round_id: number;
  round_name: string;
  user_id: number;
  name: string;
  icon: string;
  points: number;
}

// ============ MARKET TYPES ============

export interface Transfer {
  id: number;
  player_id: number;
  player_name: string;
  from_user_id: number;
  from_user_name: string;
  to_user_id: number;
  to_user_name: string;
  amount: number;
  timestamp: number;
}

export interface MarketActivity {
  transfers: Transfer[];
  total_value: number;
  avg_price: number;
}

// ============ PERFORMANCE TYPES ============

export interface StreakData {
  user_id: number;
  name: string;
  icon: string;
  streak: number;
  type: string; // hot/cold
}

export interface VolatilityData {
  user_id: number;
  name: string;
  std_dev: number;
  consistency_score: number; // 0-100
}

// ============ ANALYTICS TYPES ============

export interface LeagueTotals {
  total_points: number;
  avg_round_points: number;
  total_rounds: number;
  total_users: number;
  total_league_value: number;
}

export interface PointsProgression {
  user_id: number;
  name: string;
  round_id: number;
  round_name: string;
  points: number;
  cumulative_points: number;
}

export const TYPES_VERSION = '1.0.0';
