import { pool as pgClient } from '../../client';
import { resolveReadSeasonId } from '../../season-context';
import {
  getManagerDirectory,
  getManagerCaptainStats,
  getManagerHomeAwayStats,
  getManagerCaptainRecommendations,
  getManagerPersonalizedAlerts,
} from '@/features/managers/server';

export interface User {
  id: number;
  name: string;
  icon: string;
  color_index: number;
}

export interface SquadStats {
  user_id: number;
  squad_size: number;
  total_value: number;
  total_points: number;
}

export interface UserSquadPlayer {
  id: number;
  name: string;
  position: string;
  team: string;
  price: number;
  points: number;
  average: number;
  status?: string;
}

export type {
  ManagerSeasonStatsViewModel as UserSeasonStats,
  ManagerSquadViewModel as UserSquadDetails,
} from '@/features/managers/public';

export interface CaptainStats {
  total_rounds: number;
  extra_points: number;
  avg_points: number;
  most_used: {
    player_id: number;
    name: string;
    times_captain: number;
    avg_as_captain: number;
    total_as_captain: number;
  }[];
  best_round: { name: string; points: number };
  worst_round: { name: string; points: number };
}

export interface HomeAwayStats {
  total_home: number;
  total_away: number;
  avg_home: number;
  avg_away: number;
  difference_pct: number;
}

export interface CaptainRecommendation {
  player_id: number;
  name: string;
  position: string;
  team_id: number;
  team: string;
  avg_recent_points: number | null;
  recent_games: number;
  recent_scores: string;
  form_label: string;
}

export interface PersonalizedAlert {
  type: string;
  icon: string;
  message: string;
  severity: 'success' | 'warning' | 'info' | 'error';
}

/**
 * Get all users with their basic info
 */
export async function getAllUsers(): Promise<User[]> {
  // Preserve the legacy declaration for unmigrated callers; runtime text IDs
  // and nullable names/icons are not coerced. New boundaries model them exactly.
  return (await getManagerDirectory()) as unknown as User[];
}

/**
 * Get squad statistics for all users
 */
export async function getSquadStats(): Promise<SquadStats[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT 
      ps.owner_id as user_id,
      COUNT(p.id) as squad_size,
      SUM(COALESCE(ps.price, 0)) as total_value,
      ur.total_points
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN (
      SELECT user_id, SUM(points) as total_points
      FROM user_rounds
      WHERE season_id = $1 AND participated = TRUE
      GROUP BY user_id
    ) ur ON ps.owner_id = ur.user_id
    WHERE ps.season_id = $1 AND ps.owner_id IS NOT NULL
    GROUP BY ps.owner_id, ur.total_points
    ORDER BY total_points DESC
  `;

  return (await (pgClient as any).query(query, [seasonId])).rows.map((row: any) => ({
    ...row,
    squad_size: parseInt(row.squad_size) || 0,
    total_value: parseInt(row.total_value) || 0,
    total_points: parseInt(row.total_points) || 0,
  }));
}

/**
 * Get user squad details (Current Squad)
 */
export async function getUserSquad(userId: number | string): Promise<UserSquadPlayer[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT 
      p.id,
      p.name,
      ps.position,
      t.name as team,
      ps.price AS price,
      ps.puntos as points,
      ROUND(CAST(ps.puntos AS NUMERIC) / NULLIF(ps.partidos_jugados, 0), 1) as average,
      ps.status AS status
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON ps.team_id = t.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2
    ORDER BY ps.puntos DESC NULLS LAST
  `;

  return (await (pgClient as any).query(query, [seasonId, userId])).rows.map((row: any) => ({
    ...row,
    average: parseFloat(row.average) || 0,
    points: parseInt(row.points) || 0,
    price: parseInt(row.price) || 0,
  }));
}

/**
 * Get detailed season statistics for a specific user
 */
export { getManagerSeasonStatsData as getUserSeasonStats } from '@/features/managers/server';

/**
 * Get user's squad with price trends
 */
export { getManagerSquadData as getUserSquadDetails } from '@/features/managers/server';

/**
 * Get user's captain statistics
 */
export async function getUserCaptainStats(userId: number | string): Promise<CaptainStats> {
  return (await getManagerCaptainStats(userId)) as unknown as CaptainStats;
}

/**
 * Get user's home/away performance
 */
export async function getUserHomeAwayStats(userId: number | string): Promise<HomeAwayStats> {
  return (await getManagerHomeAwayStats(userId)) as unknown as HomeAwayStats;
}

/**
 * Get captain recommendations based on form and upcoming matches
 */
export async function getCaptainRecommendations(
  userId: number | string,
  limit: number = 3
): Promise<CaptainRecommendation[]> {
  return (await getManagerCaptainRecommendations(
    userId,
    limit
  )) as unknown as CaptainRecommendation[];
}

/**
 * Get personalized alerts for a user
 */
export async function getPersonalizedAlerts(
  userId: number | string,
  limit: number = 5
): Promise<PersonalizedAlert[]> {
  return (await getManagerPersonalizedAlerts(userId, limit)) as unknown as PersonalizedAlert[];
}

/**
 * Get a user by ID including their hashed password
 */
export async function getUserWithPassword(
  userId: string
): Promise<{ id: string; password: string | null } | undefined> {
  const result = await pgClient.query('SELECT id, password FROM users WHERE id = $1', [userId]);
  return result.rows[0];
}
