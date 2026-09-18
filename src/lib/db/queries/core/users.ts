import { pool as pgClient } from '../../client';
import { resolveReadSeasonId } from '../../season-context';
import { getPlayerFormMap } from './playerForm';
import {
  getManagerDirectory,
  getManagerCaptainStats,
  getManagerHomeAwayStats,
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
  const seasonId = await resolveReadSeasonId();
  // 1. Fetch user squad basic info
  const squadQuery = `
    SELECT 
      p.id as player_id,
      p.name,
      ps.position,
      ps.team_id as team_id,
      t.name as team
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON ps.team_id = t.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2
  `;

  const [squadRows, formMap] = await Promise.all([
    (pgClient as any).query(squadQuery, [seasonId, userId]).then((r: any) => r.rows),
    getPlayerFormMap(3), // Match the original "last 3 rounds" window
  ]);

  // 2. Merge with form data and provide recommendations
  return squadRows
    .map((row: any) => {
      const form = formMap.get(Number(row.player_id));
      const avg = form?.avg_form_score ?? null;

      let formLabel = 'Forma baja';
      if (avg == null) formLabel = 'Sin datos';
      else if (avg >= 25) formLabel = 'Excelente forma';
      else if (avg >= 18) formLabel = 'Buena forma';
      else if (avg >= 12) formLabel = 'Forma regular';

      return {
        ...row,
        avg_recent_points: avg,
        recent_games: form
          ? form.recent_scores
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s !== 'X' && s !== '?' && s !== '').length
          : 0,
        recent_scores: form?.recent_scores || '',
        form_label: formLabel,
      } as CaptainRecommendation;
    })
    .filter((p: CaptainRecommendation) => p.avg_recent_points != null && p.avg_recent_points > 0)
    .sort((a: CaptainRecommendation, b: CaptainRecommendation) => {
      if (a.avg_recent_points == null && b.avg_recent_points == null) return 0;
      if (a.avg_recent_points == null) return 1;
      if (b.avg_recent_points == null) return -1;
      return b.avg_recent_points - a.avg_recent_points;
    })
    .slice(0, limit);
}

/**
 * Get personalized alerts for a user
 */
export async function getPersonalizedAlerts(
  userId: number | string,
  limit: number = 5
): Promise<PersonalizedAlert[]> {
  const seasonId = await resolveReadSeasonId();
  const alerts: PersonalizedAlert[] = [];

  const priceGainsQuery = `
    SELECT 
      p.name,
      ps.price_increment AS price_increment
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2 AND ps.price_increment > 500000
    ORDER BY price_increment DESC
    LIMIT 2
  `;
  const priceGains = (await (pgClient as any).query(priceGainsQuery, [seasonId, userId])).rows;
  priceGains.forEach((player: any) => {
    alerts.push({
      type: 'price_gain',
      icon: '📈',
      message: `Tu jugador ${player.name} ha ganado ${(parseInt(player.price_increment) / 1000000).toFixed(2)}M€`,
      severity: 'success',
    });
  });

  const priceLossesQuery = `
    SELECT 
      p.name,
      ps.price_increment AS price_increment
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2 AND ps.price_increment < -500000
    ORDER BY price_increment ASC
    LIMIT 2
  `;
  const priceLosses = (await (pgClient as any).query(priceLossesQuery, [seasonId, userId])).rows;
  priceLosses.forEach((player: any) => {
    alerts.push({
      type: 'price_loss',
      icon: '📉',
      message: `Tu jugador ${player.name} ha perdido ${Math.abs(parseInt(player.price_increment) / 1000000).toFixed(2)}M€`,
      severity: 'warning',
    });
  });

  const recentGoodFormQuery = `
    WITH LastRound AS (
      SELECT MAX(round_id) as max_round
      FROM player_round_stats
      WHERE season_id = $1
    )
    SELECT 
      p.name,
      prs.fantasy_points
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = prs.season_id
    WHERE prs.season_id = $1
      AND ps.owner_id = $2
      AND prs.round_id = (SELECT max_round FROM LastRound)
      AND prs.fantasy_points >= 25
    ORDER BY prs.fantasy_points DESC
    LIMIT 1
  `;
  const goodForm = (await (pgClient as any).query(recentGoodFormQuery, [seasonId, userId])).rows[0];
  if (goodForm) {
    alerts.push({
      type: 'good_performance',
      icon: '⭐',
      message: `¡${goodForm.name} brilló con ${goodForm.fantasy_points} puntos!`,
      severity: 'info',
    });
  }

  return alerts.slice(0, limit);
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
