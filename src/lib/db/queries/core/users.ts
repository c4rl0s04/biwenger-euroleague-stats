import { db as pgClient } from '../../client';
import { readManagerDirectory } from './manager-directory';

export interface User {
  id: number;
  name: string;
  icon: string;
  color_index: number;
}

export type {
  ManagerCaptainStats as CaptainStats,
  ManagerHomeAwayStats as HomeAwayStats,
  ManagerCaptainRecommendation as CaptainRecommendation,
  ManagerPersonalizedAlert as PersonalizedAlert,
  ManagerSeasonStatsViewModel as UserSeasonStats,
  ManagerSquadViewModel as UserSquadDetails,
} from '@/features/managers/public';

/**
 * Get all users with their basic info
 */
export async function getAllUsers(): Promise<User[]> {
  // Preserve the legacy declaration for unmigrated callers; runtime text IDs
  // and nullable names/icons are not coerced. New boundaries model them exactly.
  return (await readManagerDirectory()) as unknown as User[];
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
export { getManagerCaptainStats as getUserCaptainStats } from '@/features/managers/server';
/**
 * Get user's home/away performance
 */
export { getManagerHomeAwayStats as getUserHomeAwayStats } from '@/features/managers/server';
/**
 * Get captain recommendations based on form and upcoming matches
 */
export { getManagerCaptainRecommendations as getCaptainRecommendations } from '@/features/managers/server';
/**
 * Get personalized alerts for a user
 */
export { getManagerPersonalizedAlerts as getPersonalizedAlerts } from '@/features/managers/server';
/**
 * Get a user by ID including their hashed password
 */
export async function getUserWithPassword(userId: string) {
  const result = await pgClient.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0];
}
