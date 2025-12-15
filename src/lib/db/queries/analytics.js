import { db } from '../client.js';

/**
 * Calculates the actual performance of initial squads based on lineup usage.
 * Appreciation: Starter (1.0), 6th Man (0.75), Bench (0.5).
 * 
 * @returns {Array} List of users with their total weighted points.
 */
export function getInitialSquadActualPerformance() {
  const query = `
    SELECT 
      users.name as user_name,
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
    GROUP BY isq.user_id
    ORDER BY total_points DESC
  `;
  return db.prepare(query).all();
}

/**
 * Calculates the theoretical maximum points of initial squads if they were never sold or benched.
 * 
 * @returns {Array} List of users with their potential total points.
 */
export function getInitialSquadTheoreticalPotential() {
  const query = `
    SELECT 
      u.name as user_name,
      SUM(prs.fantasy_points) as potential_points
    FROM initial_squads isq
    JOIN users u ON isq.user_id = u.id
    JOIN player_round_stats prs ON isq.player_id = prs.player_id
    GROUP BY u.name
    ORDER BY potential_points DESC
  `;
  return db.prepare(query).all();
}

/**
 * Get detailed potential breakdown by player for a specific user (or all if null)
 */
export function getTheoreticalBreakdown() {
   const query = `
    SELECT 
      u.name as user_name,
      p.name as player_name,
      SUM(prs.fantasy_points) as player_total_points
    FROM initial_squads isq
    JOIN users u ON isq.user_id = u.id
    JOIN players p ON isq.player_id = p.id
    JOIN player_round_stats prs ON isq.player_id = prs.player_id
    GROUP BY u.name, p.name
    ORDER BY u.name, player_total_points DESC
  `;
  return db.prepare(query).all();
}
