import { db, pgClient } from '../../index';

export interface InitialSquadPerformance {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  total_points: number;
}

export interface InitialSquadPotential {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  potential_points: number;
}

export interface TheoreticalBreakdown {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  player_name: string;
  player_total_points: number;
}

export interface BestInitialSquadPlayer {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  player_name: string;
  player_id: number;
  total_fantasy_points: number;
}

export interface InitialSquadRetainedPoints {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  players_contributed: number;
  total_points: number;
}

export interface InitialSquadPlayerBreakdown {
  user_id: string;
  user_name: string;
  icon: string | null;
  player_name: string;
  points: number;
}

export interface InitialSquadRegret {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  points_lost: number;
  top_regret_player: string;
}

export interface InitialSquadLoyalty {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  retained_count: number;
  initial_count: number;
  loyalty_percentage: number;
}

export interface InitialSquadPotentialAdvanced {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  total_points: number;
  total_value: number;
}

/**
 * Calculates the actual performance of initial squads based on lineup usage.
 * Appreciation: Starter (1.0), 6th Man (0.75), Bench (0.5).
 */
export interface InitialSquadPerformance {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  actual_points: number;
  potential_points: number;
  roi_percentage: number;
}

/**
 * Calculates the actual performance of initial squads vs potential.
 * ROI = Actual / Potential
 */
export async function getInitialSquadActualPerformance(): Promise<InitialSquadPerformance[]> {
  const query = `
    WITH actual AS (
      SELECT 
        isq.user_id,
        SUM(
          CASE 
            WHEN l.role = 'titular' THEN prs.fantasy_points * 1.0
            WHEN l.role = '6th_man' THEN prs.fantasy_points * 0.75
            WHEN l.role = 'suplente' THEN prs.fantasy_points * 0.5
            ELSE 0
          END
        ) as actual_points
      FROM initial_squads isq
      JOIN lineups l ON isq.player_id = l.player_id AND isq.user_id = l.user_id
      JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
      GROUP BY isq.user_id
    ),
    potential AS (
      SELECT 
        isq.user_id,
        SUM(prs.fantasy_points) as potential_points
      FROM initial_squads isq
      JOIN player_round_stats prs ON isq.player_id = prs.player_id
      GROUP BY isq.user_id
    )
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      u.icon as icon,
      COALESCE(a.actual_points, 0) as actual_points,
      COALESCE(p.potential_points, 0) as potential_points,
      CASE 
        WHEN COALESCE(p.potential_points, 0) > 0 
        THEN ROUND((COALESCE(a.actual_points, 0) * 100.0 / p.potential_points), 1)
        ELSE 0 
      END as roi_percentage
    FROM users u
    LEFT JOIN actual a ON u.id = a.user_id
    LEFT JOIN potential p ON u.id = p.user_id
    WHERE a.actual_points IS NOT NULL OR p.potential_points IS NOT NULL
    ORDER BY roi_percentage DESC
  `;
  return (await pgClient.query(query)).rows.map((row: any) => ({
    ...row,
    actual_points: parseFloat(row.actual_points) || 0,
    potential_points: parseFloat(row.potential_points) || 0,
    roi_percentage: parseFloat(row.roi_percentage) || 0,
  }));
}

/**
 * Stat A: For every user, their best performing initial squad player,
 * measured by fantasy points scored ONLY while that player was in their lineup.
 * Returns one row per user, sorted by points descending.
 */
export async function getBestInitialSquadPlayer(): Promise<BestInitialSquadPlayer[]> {
  const query = `
    WITH player_user_points AS (
      SELECT
        u.id as user_id,
        u.name as user_name,
        u.color_index as user_color_index,
        u.icon as icon,
        isq.player_id,
        p.name as player_name,
        SUM(prs.fantasy_points) as points_while_owned
      FROM initial_squads isq
      JOIN users u ON u.id = isq.user_id
      JOIN players p ON p.id = isq.player_id
      JOIN lineups l ON l.player_id = isq.player_id AND l.user_id = isq.user_id
      JOIN player_round_stats prs ON prs.player_id = l.player_id AND prs.round_id = l.round_id
      GROUP BY u.id, u.name, u.color_index, u.icon, isq.player_id, p.name
    ),
    ranked AS (
      SELECT *,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY points_while_owned DESC) as rn
      FROM player_user_points
    )
    SELECT user_id, user_name, user_color_index, icon, player_name, player_id, points_while_owned as total_fantasy_points
    FROM ranked
    WHERE rn = 1
    ORDER BY total_fantasy_points DESC
  `;
  return (await pgClient.query(query)).rows.map((row: any) => ({
    ...row,
    player_id: parseInt(row.player_id),
    total_fantasy_points: parseFloat(row.total_fantasy_points) || 0,
  }));
}

/**
 * Stat B: Per-user total fantasy points from ALL initial squad players
 * while they were in the user's lineup (regardless of whether they were later sold).
 * Shows how many initial players contributed points.
 */
export async function getInitialSquadRetainedPoints(): Promise<InitialSquadRetainedPoints[]> {
  const query = `
    SELECT
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      u.icon as icon,
      COUNT(DISTINCT isq.player_id) as players_contributed,
      SUM(prs.fantasy_points) as total_points
    FROM initial_squads isq
    JOIN users u ON u.id = isq.user_id
    JOIN lineups l ON l.player_id = isq.player_id AND l.user_id = isq.user_id
    JOIN player_round_stats prs ON prs.player_id = l.player_id AND prs.round_id = l.round_id
    GROUP BY u.id, u.name, u.color_index, u.icon
    ORDER BY total_points DESC
  `;
  return (await pgClient.query(query)).rows.map((row: any) => ({
    ...row,
    players_contributed: parseInt(row.players_contributed) || 0,
    total_points: parseFloat(row.total_points) || 0,
  }));
}

/**
 * Detailed breakdown of points for Stat B: points per player for each user.
 */
export async function getInitialSquadRetainedBreakdown(): Promise<InitialSquadPlayerBreakdown[]> {
  const query = `
    SELECT
      u.id as user_id,
      u.name as user_name,
      u.icon as icon,
      p.name as player_name,
      SUM(prs.fantasy_points) as points
    FROM initial_squads isq
    JOIN users u ON u.id = isq.user_id
    JOIN players p ON p.id = isq.player_id
    JOIN lineups l ON l.player_id = isq.player_id AND l.user_id = isq.user_id
    JOIN player_round_stats prs ON prs.player_id = l.player_id AND prs.round_id = l.round_id
    GROUP BY u.id, u.name, u.icon, p.name
    ORDER BY u.name, points DESC
  `;
  return (await pgClient.query(query)).rows.map((row: any) => ({
    ...row,
    points: parseFloat(row.points) || 0,
  }));
}

/**
 * Calculates the theoretical maximum points of initial squads if they were never sold or benched.
 */
export async function getInitialSquadTheoreticalPotential(): Promise<InitialSquadPotential[]> {
  const query = `
    SELECT 
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      u.icon as icon,
      SUM(prs.fantasy_points) as potential_points
    FROM initial_squads isq
    JOIN users u ON isq.user_id = u.id
    JOIN player_round_stats prs ON isq.player_id = prs.player_id
    GROUP BY u.id, u.name, u.color_index, u.icon
    ORDER BY potential_points DESC
  `;
  return (await pgClient.query(query)).rows.map((row: any) => ({
    ...row,
    potential_points: parseInt(row.potential_points) || 0,
  }));
}

/**
 * Get detailed potential breakdown by player for a specific user (or all if null)
 */
export async function getTheoreticalBreakdown(): Promise<TheoreticalBreakdown[]> {
  const query = `
    SELECT 
      u.name as user_name,
      u.color_index as user_color_index,
      p.name as player_name,
      SUM(prs.fantasy_points) as player_total_points
    FROM initial_squads isq
    JOIN users u ON isq.user_id = u.id
    JOIN players p ON isq.player_id = p.id
    JOIN player_round_stats prs ON isq.player_id = prs.player_id
    GROUP BY u.name, u.color_index, p.name
    ORDER BY u.name, player_total_points DESC
  `;
  return (await pgClient.query(query)).rows.map((row: any) => ({
    ...row,
    points: parseFloat(row.points) || 0,
  }));
}

export interface InitialSquadDetailed {
  user_id: string | number;
  manager_name: string;
  manager_color_index: number;
  player_id: number;
  player_name: string;
  player_position: string;
  current_points: number;
  current_price: number;
  current_owner_id: string | number | null;
  current_owner: string | null;
  current_owner_color_index: number | null;
  points_contributed: number;
}

/**
 * Stat 1: Regret (El Arrepentimiento)
 * Points scored by initial squad players during rounds where they were NOT in the owner's lineup.
 */
export async function getInitialSquadRegret(): Promise<InitialSquadRegret[]> {
  const query = `
    WITH regret_points AS (
      SELECT
        u.id as user_id,
        u.name as user_name,
        u.color_index as user_color_index,
        u.icon as icon,
        p.name as player_name,
        prs.fantasy_points
      FROM initial_squads isq
      JOIN users u ON u.id = isq.user_id
      JOIN players p ON p.id = isq.player_id
      JOIN player_round_stats prs ON prs.player_id = isq.player_id
      LEFT JOIN lineups l ON l.player_id = isq.player_id 
                         AND l.user_id = isq.user_id 
                         AND l.round_id = prs.round_id
      WHERE l.id IS NULL
    ),
    aggregated AS (
      SELECT 
        user_id,
        user_name,
        user_color_index,
        icon,
        SUM(fantasy_points) as points_lost,
        (
          SELECT player_name 
          FROM regret_points rp2 
          WHERE rp2.user_id = regret_points.user_id 
          GROUP BY player_name 
          ORDER BY SUM(fantasy_points) DESC 
          LIMIT 1
        ) as top_regret_player
      FROM regret_points
      GROUP BY user_id, user_name, user_color_index, icon
    )
    SELECT * FROM aggregated ORDER BY points_lost DESC
  `;
  return (await pgClient.query(query)).rows.map((row: any) => ({
    ...row,
    points_lost: parseFloat(row.points_lost) || 0,
  }));
}

/**
 * Stat 2: Loyalty (Fidelidad al ADN)
 * % of initial squad players still owned by the user.
 */
export async function getInitialSquadLoyalty(): Promise<InitialSquadLoyalty[]> {
  const query = `
    SELECT
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      u.icon as icon,
      COUNT(*) FILTER (WHERE p.owner_id = isq.user_id) as retained_count,
      COUNT(*) as initial_count,
      ROUND(COUNT(*) FILTER (WHERE p.owner_id = isq.user_id) * 100.0 / COUNT(*), 1) as loyalty_percentage
    FROM initial_squads isq
    JOIN users u ON u.id = isq.user_id
    JOIN players p ON p.id = isq.player_id
    GROUP BY u.id, u.name, u.color_index, u.icon
    ORDER BY loyalty_percentage DESC
  `;
  return (await pgClient.query(query)).rows.map((row: any) => ({
    ...row,
    retained_count: parseInt(row.retained_count) || 0,
    initial_count: parseInt(row.initial_count) || 0,
    loyalty_percentage: parseFloat(row.loyalty_percentage) || 0,
  }));
}

/**
 * Stat 6: Potential (Potencial del Reparto)
 * Total points and current market value of the initial squad.
 */
export async function getInitialSquadPotentialAdvanced(): Promise<InitialSquadPotentialAdvanced[]> {
  const query = `
    SELECT
      u.id as user_id,
      u.name as user_name,
      u.color_index as user_color_index,
      u.icon as icon,
      SUM(p.puntos) as total_points,
      SUM(p.price) as total_value
    FROM initial_squads isq
    JOIN users u ON u.id = isq.user_id
    JOIN players p ON p.id = isq.player_id
    GROUP BY u.id, u.name, u.color_index, u.icon
    ORDER BY total_points DESC
  `;
  return (await pgClient.query(query)).rows.map((row: any) => ({
    ...row,
    total_points: parseFloat(row.total_points) || 0,
    total_value: parseFloat(row.total_value) || 0,
  }));
}

/**
 * Detailed view of all initial squads.
 */
export async function getInitialSquadsDetailed(): Promise<InitialSquadDetailed[]> {
  const query = `
    SELECT 
        u.id as user_id,
        u.name as manager_name,
        u.color_index as manager_color_index,
        p.id as player_id,
        p.name as player_name,
        p.puntos as current_points,
        p.price as current_price,
        p.position as player_position,
        p.owner_id as current_owner_id,
        (SELECT name FROM users u2 WHERE u2.id = p.owner_id) as current_owner,
        (SELECT color_index FROM users u2 WHERE u2.id = p.owner_id) as current_owner_color_index,
        (SELECT COALESCE(SUM(prs.fantasy_points), 0)
         FROM lineups l 
         JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
         WHERE l.user_id = isq.user_id AND l.player_id = isq.player_id
        ) as points_contributed
    FROM initial_squads isq
    JOIN users u ON u.id = isq.user_id
    JOIN players p ON p.id = isq.player_id
    ORDER BY u.name, 
             CASE p.position 
               WHEN 'G' THEN 1 
               WHEN 'F' THEN 2 
               WHEN 'C' THEN 3 
               ELSE 4 
             END, 
             p.price DESC
  `;
  return (await pgClient.query(query)).rows.map((row: any) => ({
    ...row,
    current_points: parseFloat(row.current_points) || 0,
    current_price: parseFloat(row.current_price) || 0,
    points_contributed: parseFloat(row.points_contributed) || 0,
  }));
}
