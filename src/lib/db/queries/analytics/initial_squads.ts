import { db } from '../../client';

export interface InitialSquadPerformance {
  user_name: string;
  user_color_index: number;
  total_points: number;
}

export interface InitialSquadPotential {
  user_name: string;
  user_color_index: number;
  potential_points: number;
}

export interface TheoreticalBreakdown {
  user_name: string;
  user_color_index: number;
  player_name: string;
  player_total_points: number;
}

export interface BestInitialSquadPlayer {
  user_name: string;
  user_color_index: number;
  player_name: string;
  player_id: number;
  total_fantasy_points: number;
}

export interface InitialSquadRetainedPoints {
  user_name: string;
  user_color_index: number;
  players_contributed: number;
  total_points: number;
}

export interface InitialSquadPlayerBreakdown {
  user_name: string;
  player_name: string;
  points: number;
}

export interface InitialSquadRegret {
  user_name: string;
  user_color_index: number;
  points_lost: number;
  top_regret_player: string;
}

export interface InitialSquadLoyalty {
  user_name: string;
  user_color_index: number;
  retained_count: number;
  initial_count: number;
  loyalty_percentage: number;
}

export interface InitialSquadPotentialAdvanced {
  user_name: string;
  user_color_index: number;
  total_points: number;
  total_value: number;
}

/**
 * Calculates the actual performance of initial squads based on lineup usage.
 * Appreciation: Starter (1.0), 6th Man (0.75), Bench (0.5).
 */
export async function getInitialSquadActualPerformance(): Promise<InitialSquadPerformance[]> {
  const query = `
    SELECT 
      users.name as user_name,
      users.color_index as user_color_index,
      SUM(
        CASE 
          WHEN l.role = 'titular' THEN prs.fantasy_points * 1.0
          WHEN l.role = '6th_man' THEN prs.fantasy_points * 0.75
          WHEN l.role = 'suplente' THEN prs.fantasy_points * 0.5
          ELSE 0
        END
      ) as total_points
    FROM initial_squads isq
    JOIN lineups l ON isq.player_id = l.player_id AND isq.user_id = l.user_id
    JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    JOIN users ON isq.user_id = users.id
    GROUP BY isq.user_id, users.name, users.color_index
    ORDER BY total_points DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    total_points: parseFloat(row.total_points) || 0,
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
        isq.user_id,
        u.name as user_name,
        u.color_index as user_color_index,
        isq.player_id,
        p.name as player_name,
        SUM(prs.fantasy_points) as points_while_owned
      FROM initial_squads isq
      JOIN users u ON u.id = isq.user_id
      JOIN players p ON p.id = isq.player_id
      JOIN lineups l ON l.player_id = isq.player_id AND l.user_id = isq.user_id
      JOIN player_round_stats prs ON prs.player_id = l.player_id AND prs.round_id = l.round_id
      GROUP BY isq.user_id, u.name, u.color_index, isq.player_id, p.name
    ),
    ranked AS (
      SELECT *,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY points_while_owned DESC) as rn
      FROM player_user_points
    )
    SELECT user_name, user_color_index, player_name, player_id, points_while_owned as total_fantasy_points
    FROM ranked
    WHERE rn = 1
    ORDER BY total_fantasy_points DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
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
      u.name as user_name,
      u.color_index as user_color_index,
      COUNT(DISTINCT isq.player_id) as players_contributed,
      SUM(prs.fantasy_points) as total_points
    FROM initial_squads isq
    JOIN users u ON u.id = isq.user_id
    JOIN lineups l ON l.player_id = isq.player_id AND l.user_id = isq.user_id
    JOIN player_round_stats prs ON prs.player_id = l.player_id AND prs.round_id = l.round_id
    GROUP BY isq.user_id, u.name, u.color_index
    ORDER BY total_points DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
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
      u.name as user_name,
      p.name as player_name,
      SUM(prs.fantasy_points) as points
    FROM initial_squads isq
    JOIN users u ON u.id = isq.user_id
    JOIN players p ON p.id = isq.player_id
    JOIN lineups l ON l.player_id = isq.player_id AND l.user_id = isq.user_id
    JOIN player_round_stats prs ON prs.player_id = l.player_id AND prs.round_id = l.round_id
    GROUP BY isq.user_id, u.name, p.name
    ORDER BY u.name, points DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
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
      u.name as user_name,
      u.color_index as user_color_index,
      SUM(prs.fantasy_points) as potential_points
    FROM initial_squads isq
    JOIN users u ON isq.user_id = u.id
    JOIN player_round_stats prs ON isq.player_id = prs.player_id
    GROUP BY u.name, u.color_index
    ORDER BY potential_points DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
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
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    points: parseFloat(row.points) || 0,
  }));
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
        user_name,
        user_color_index,
        SUM(fantasy_points) as points_lost,
        (
          SELECT player_name 
          FROM regret_points rp2 
          WHERE rp2.user_name = regret_points.user_name 
          GROUP BY player_name 
          ORDER BY SUM(fantasy_points) DESC 
          LIMIT 1
        ) as top_regret_player
      FROM regret_points
      GROUP BY user_name, user_color_index
    )
    SELECT * FROM aggregated ORDER BY points_lost DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
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
      u.name as user_name,
      u.color_index as user_color_index,
      COUNT(*) FILTER (WHERE p.owner_id = isq.user_id) as retained_count,
      COUNT(*) as initial_count,
      ROUND(COUNT(*) FILTER (WHERE p.owner_id = isq.user_id) * 100.0 / COUNT(*), 1) as loyalty_percentage
    FROM initial_squads isq
    JOIN users u ON u.id = isq.user_id
    JOIN players p ON p.id = isq.player_id
    GROUP BY u.name, u.color_index
    ORDER BY loyalty_percentage DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
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
      u.name as user_name,
      u.color_index as user_color_index,
      SUM(p.puntos) as total_points,
      SUM(p.price) as total_value
    FROM initial_squads isq
    JOIN users u ON u.id = isq.user_id
    JOIN players p ON p.id = isq.player_id
    GROUP BY u.name, u.color_index
    ORDER BY total_points DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    total_points: parseFloat(row.total_points) || 0,
    total_value: parseFloat(row.total_value) || 0,
  }));
}
