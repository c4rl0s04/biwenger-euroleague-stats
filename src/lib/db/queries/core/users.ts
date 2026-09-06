import { db as pgClient } from '../../client';
import { resolveReadSeasonId } from '../../season-context';
import { getPlayerFormMap } from './playerForm';

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
  avg_recent_points: number;
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
  const seasonId = await resolveReadSeasonId();
  const result = await (pgClient as any).query(
    `
    SELECT
      u.id,
      COALESCE(us.name, u.name) AS name,
      COALESCE(us.icon, u.icon) AS icon,
      COALESCE(us.color_index, u.color_index, 0) AS color_index
    FROM user_seasons us
    JOIN users u ON u.id = us.user_id
    WHERE us.season_id = $1
      AND COALESCE(us.status, 'active') = 'active'
    ORDER BY COALESCE(us.name, u.name) ASC, u.id ASC
  `,
    [seasonId]
  );
  return result.rows as User[];
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
      SUM(COALESCE(ps.price, p.price, 0)) as total_value,
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
      p.position,
      t.name as team,
      COALESCE(ps.price, p.price) AS price,
      COALESCE(ps.puntos, p.puntos) as points,
      ROUND(CAST(COALESCE(ps.puntos, p.puntos) AS NUMERIC) / NULLIF(COALESCE(ps.partidos_jugados, p.partidos_jugados), 0), 1) as average,
      COALESCE(ps.status, p.status) AS status
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2
    ORDER BY COALESCE(ps.puntos, p.puntos) DESC
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
  const seasonId = await resolveReadSeasonId();
  const overallQuery = `
    SELECT 
      COUNT(DISTINCT l.round_id) as total_rounds,
      SUM(COALESCE(prs.fantasy_points, 0)) as extra_points,
      AVG(COALESCE(prs.fantasy_points, 0)) as avg_points
    FROM lineups l
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id AND prs.season_id = l.season_id
    WHERE l.season_id = $2 AND l.user_id = $1 AND l.is_captain = TRUE
  `;
  const overallRes = await (pgClient as any).query(overallQuery, [userId, seasonId]);
  const overall = overallRes.rows[0];

  const mostUsedQuery = `
    SELECT 
      p.id as player_id,
      p.name,
      COUNT(DISTINCT l.round_id) as times_captain,
      AVG(COALESCE(prs.fantasy_points, 0)) as avg_as_captain,
      SUM(COALESCE(prs.fantasy_points, 0)) as total_as_captain
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id AND prs.season_id = l.season_id
    WHERE l.season_id = $2 AND l.user_id = $1 AND l.is_captain = TRUE
    GROUP BY l.player_id, p.id, p.name
    ORDER BY times_captain DESC, avg_as_captain DESC
  `;
  const mostUsedRes = await (pgClient as any).query(mostUsedQuery, [userId, seasonId]);
  const mostUsed = mostUsedRes.rows;

  const bestQuery = `
    SELECT 
      p.name,
      COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id AND prs.season_id = l.season_id
    WHERE l.season_id = $2 AND l.user_id = $1 AND l.is_captain = TRUE
    ORDER BY points DESC
    LIMIT 1
  `;
  const bestRes = await (pgClient as any).query(bestQuery, [userId, seasonId]);
  const best = bestRes.rows[0];

  const worstQuery = `
    SELECT 
      p.name,
      COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id AND prs.season_id = l.season_id
    WHERE l.season_id = $2 AND l.user_id = $1 AND l.is_captain = TRUE
    ORDER BY points ASC
    LIMIT 1
  `;
  const worstRes = await (pgClient as any).query(worstQuery, [userId, seasonId]);
  const worst = worstRes.rows[0];

  return {
    total_rounds: overall ? parseInt(overall.total_rounds) : 0,
    extra_points: overall ? parseInt(overall.extra_points) : 0,
    avg_points: overall ? parseFloat(overall.avg_points) : 0,
    most_used: mostUsed.map((m: any) => ({
      ...m,
      avg_as_captain: parseFloat(m.avg_as_captain) || 0,
      times_captain: parseInt(m.times_captain) || 0,
      total_as_captain: parseInt(m.total_as_captain) || 0,
    })),
    best_round: best
      ? { name: best.name, points: parseInt(best.points) || 0 }
      : { name: '', points: 0 },
    worst_round: worst
      ? { name: worst.name, points: parseInt(worst.points) || 0 }
      : { name: '', points: 0 },
  };
}

/**
 * Get user's home/away performance
 */
export async function getUserHomeAwayStats(userId: number | string): Promise<HomeAwayStats> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT 
      SUM(points_home) as total_home,
      SUM(points_away) as total_away,
      SUM(played_home) as games_home,
      SUM(played_away) as games_away
    FROM player_seasons
    WHERE season_id = $1 AND owner_id = $2
  `;

  const statsRes = await (pgClient as any).query(query, [seasonId, userId]);
  const stats = statsRes.rows[0];

  // Safely parse
  const totalHome = parseInt(stats.total_home) || 0;
  const totalAway = parseInt(stats.total_away) || 0;
  const gamesHome = parseInt(stats.games_home) || 0;
  const gamesAway = parseInt(stats.games_away) || 0;

  return {
    total_home: totalHome,
    total_away: totalAway,
    avg_home: gamesHome > 0 ? Math.round(totalHome / gamesHome) : 0,
    avg_away: gamesAway > 0 ? Math.round(totalAway / gamesAway) : 0,
    difference_pct:
      totalHome > 0 && totalAway > 0 ? Math.round(((totalHome - totalAway) / totalAway) * 100) : 0,
  };
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
      p.position,
      COALESCE(ps.team_id, p.team_id) as team_id,
      t.name as team
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
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
      const avg = form?.avg_form_score || 0;

      let formLabel = 'Forma baja';
      if (avg >= 25) formLabel = 'Excelente forma';
      else if (avg >= 18) formLabel = 'Buena forma';
      else if (avg >= 12) formLabel = 'Forma regular';

      return {
        ...row,
        avg_recent_points: avg,
        recent_games: form ? form.recent_scores.split(',').filter((s) => s !== 'X').length : 0,
        recent_scores: form?.recent_scores || '',
        form_label: formLabel,
      } as CaptainRecommendation;
    })
    .filter((p: CaptainRecommendation) => p.avg_recent_points > 0)
    .sort(
      (a: CaptainRecommendation, b: CaptainRecommendation) =>
        b.avg_recent_points - a.avg_recent_points
    )
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
      COALESCE(ps.price_increment, p.price_increment) AS price_increment
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2 AND COALESCE(ps.price_increment, p.price_increment) > 500000
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
      COALESCE(ps.price_increment, p.price_increment) AS price_increment
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2 AND COALESCE(ps.price_increment, p.price_increment) < -500000
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
export async function getUserWithPassword(userId: string) {
  const result = await pgClient.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0];
}
