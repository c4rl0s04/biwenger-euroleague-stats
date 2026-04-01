import { db, pgClient } from '../../index';
import { getSimpleStandings as getStandings } from '../competition/standings';
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

export interface UserSeasonStats {
  name: string;
  color_index: number;
  total_points: number;
  best_round: number;
  worst_round: number;
  average_points: number;
  rounds_played: number;
  best_position: number;
  worst_position: number;
  average_position: number;
  victories: number;
  podiums: number;
  purchases: number;
  sales: number;
  position: number;
  team_value: number;
  price_trend: number;
}

export interface UserSquadDetails {
  total_value: number;
  price_trend: number;
  total_points: number;
  player_count: number;
  position: number;
  top_rising: any[]; // refined below if needed
  top_falling: any[];
}

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
  const result = await pgClient.query(
    'SELECT id, name, icon, color_index FROM users ORDER BY name ASC'
  );
  return result.rows as User[];
}

/**
 * Get squad statistics for all users
 */
export async function getSquadStats(): Promise<SquadStats[]> {
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
      WHERE participated = TRUE
      GROUP BY user_id
    ) ur ON p.owner_id = ur.user_id
    WHERE p.owner_id IS NOT NULL
    GROUP BY p.owner_id, ur.total_points
    ORDER BY total_points DESC
  `;

  return (await pgClient.query(query)).rows.map((row: any) => ({
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
  const query = `
    SELECT 
      p.id,
      p.name,
      p.position,
      t.name as team,
      p.price,
      p.puntos as points,
      ROUND(CAST(p.puntos AS NUMERIC) / NULLIF(p.partidos_jugados, 0), 1) as average,
      p.status
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.owner_id = $1
    ORDER BY p.puntos DESC
  `;

  return (await pgClient.query(query, [userId])).rows.map((row: any) => ({
    ...row,
    average: parseFloat(row.average) || 0,
    points: parseInt(row.points) || 0,
    price: parseInt(row.price) || 0,
  }));
}

/**
 * Get detailed season statistics for a specific user
 */
export async function getUserSeasonStats(userId: number | string): Promise<UserSeasonStats> {
  // First get user details for name
  const userRes = await pgClient.query('SELECT name, color_index FROM users WHERE id = $1', [
    userId,
  ]);
  const user = userRes.rows[0];

  const statsQuery = `
    WITH UserRounds AS (
      SELECT 
        user_id,
        points,
        participated
      FROM user_rounds
      WHERE user_id = $1 AND participated = TRUE
    )
    SELECT 
      COALESCE(SUM(points), 0) as total_points,
      COALESCE(MAX(points), 0) as best_round,
      COALESCE(MIN(points), 0) as worst_round,
      COALESCE(ROUND(AVG(points), 1), 0) as average_points,
      COUNT(*) as rounds_played
    FROM UserRounds
  `;

  const statsRes = await pgClient.query(statsQuery, [userId]);
  const stats = statsRes.rows[0];

  const positionsQuery = `
    WITH RoundPositions AS (
      SELECT 
        ur.round_id,
        ur.user_id,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE ur.participated = TRUE
    )
    SELECT 
      MIN(position) as best_position,
      MAX(position) as worst_position,
      ROUND(AVG(position), 1) as average_position,
      COUNT(CASE WHEN position = 1 THEN 1 END) as victories,
      COUNT(CASE WHEN position <= 3 THEN 1 END) as podiums
    FROM RoundPositions
    WHERE user_id = $1
  `;

  // Transfers query
  const transfersQuery = `
    SELECT
      COUNT(CASE WHEN comprador = $1 THEN 1 END) as purchases,
      COUNT(CASE WHEN vendedor = $2 THEN 1 END) as sales
    FROM fichajes
  `;

  const positionsRes = await pgClient.query(positionsQuery, [userId]);
  const positions = positionsRes.rows[0];

  let transfers = { purchases: 0, sales: 0 };
  if (user) {
    const transfersRes = await pgClient.query(transfersQuery, [user.name, user.name]); // using names as per schema
    transfers = transfersRes.rows[0] || transfers;
  }

  const standings = await getStandings();
  // Ensure ID type comparison safety
  const userStanding = standings.find((u: any) => String(u.user_id) === String(userId));

  return {
    name: user?.name || 'Desconocido',
    color_index: user?.color_index ?? 0,

    // Stats Parsing
    total_points: parseInt(stats?.total_points) || 0,
    best_round: parseInt(stats?.best_round) || 0,
    worst_round: parseInt(stats?.worst_round) || 0,
    average_points: parseFloat(stats?.average_points) || 0,
    rounds_played: parseInt(stats?.rounds_played) || 0,

    // Positions Parsing
    best_position: parseInt(positions?.best_position) || 0,
    worst_position: parseInt(positions?.worst_position) || 0,
    average_position: parseFloat(positions?.average_position) || 0,
    victories: parseInt(positions?.victories) || 0,
    podiums: parseInt(positions?.podiums) || 0,

    // Transfers Parsing
    purchases: Number(transfers?.purchases) || 0,
    sales: Number(transfers?.sales) || 0,

    position: Number((userStanding as any)?.position) || 0,
    team_value: Number((userStanding as any)?.team_value) || 0,
    price_trend: Number((userStanding as any)?.price_trend) || 0,
  };
}

/**
 * Get user's squad with price trends
 */
export async function getUserSquadDetails(userId: number | string): Promise<UserSquadDetails> {
  const squadQuery = `
    SELECT 
      p.id, p.name, p.position, t.name as team, p.price, p.price_increment, p.puntos as points
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.owner_id = $1
    ORDER BY price_increment DESC
  `;

  const squadRes = await pgClient.query(squadQuery, [userId]);
  const squad = squadRes.rows;

  // Get user's actual competition points from user_rounds
  const userPointsQuery = `
    SELECT COALESCE(SUM(points), 0) as total_points
    FROM user_rounds
    WHERE user_id = $1 AND participated = TRUE
  `;
  const userPointsRes = await pgClient.query(userPointsQuery, [userId]);
  const userPoints = userPointsRes.rows[0];

  // Convert to numbers explicitly to assume safety
  const totalValue = squad.reduce((sum: number, p: any) => sum + (parseInt(p.price) || 0), 0);
  const totalTrend = squad.reduce(
    (sum: number, p: any) => sum + (parseInt(p.price_increment) || 0),
    0
  );

  // Get standings for position
  const standings = await getStandings();
  const userStanding = standings.find((u: any) => String(u.user_id) === String(userId));

  return {
    total_value: totalValue,
    price_trend: totalTrend,
    total_points: userPoints?.total_points || 0,
    player_count: squad.length,
    position: Number((userStanding as any)?.position) || 0,
    top_rising: squad.filter((p: any) => (parseInt(p.price_increment) || 0) > 0).slice(0, 7),
    top_falling: squad
      .filter((p: any) => (parseInt(p.price_increment) || 0) < 0)
      .slice(-7)
      .reverse(),
  };
}

/**
 * Get user's captain statistics
 */
export async function getUserCaptainStats(userId: number | string): Promise<CaptainStats> {
  const overallQuery = `
    SELECT 
      COUNT(DISTINCT l.round_id) as total_rounds,
      SUM(COALESCE(prs.fantasy_points, 0)) as extra_points,
      AVG(COALESCE(prs.fantasy_points, 0)) as avg_points
    FROM lineups l
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = $1 AND l.is_captain = TRUE
  `;
  const overallRes = await pgClient.query(overallQuery, [userId]);
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
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = $1 AND l.is_captain = TRUE
    GROUP BY l.player_id, p.id, p.name
    ORDER BY times_captain DESC, avg_as_captain DESC
  `;
  const mostUsedRes = await pgClient.query(mostUsedQuery, [userId]);
  const mostUsed = mostUsedRes.rows;

  const bestQuery = `
    SELECT 
      p.name,
      COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = $1 AND l.is_captain = TRUE
    ORDER BY points DESC
    LIMIT 1
  `;
  const bestRes = await pgClient.query(bestQuery, [userId]);
  const best = bestRes.rows[0];

  const worstQuery = `
    SELECT 
      p.name,
      COALESCE(prs.fantasy_points, 0) as points
    FROM lineups l
    JOIN players p ON l.player_id = p.id
    LEFT JOIN player_round_stats prs ON l.player_id = prs.player_id AND l.round_id = prs.round_id
    WHERE l.user_id = $1 AND l.is_captain = TRUE
    ORDER BY points ASC
    LIMIT 1
  `;
  const worstRes = await pgClient.query(worstQuery, [userId]);
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
  const query = `
    SELECT 
      SUM(points_home) as total_home,
      SUM(points_away) as total_away,
      SUM(played_home) as games_home,
      SUM(played_away) as games_away
    FROM players
    WHERE owner_id = $1
  `;

  const statsRes = await pgClient.query(query, [userId]);
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
  // 1. Fetch user squad basic info
  const squadQuery = `
    SELECT 
      p.id as player_id,
      p.name,
      p.position,
      t.id as team_id,
      t.name as team
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.owner_id = $1
  `;

  const [squadRows, formMap] = await Promise.all([
    pgClient.query(squadQuery, [userId]).then((r) => r.rows),
    getPlayerFormMap(3), // Match the original "last 3 rounds" window
  ]);

  // 2. Merge with form data and provide recommendations
  return squadRows
    .map((row: any) => {
      const form = formMap.get(Number(row.player_id));
      const avg = form?.avg_recent_points || 0;

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
    .filter((p) => p.avg_recent_points > 0)
    .sort((a, b) => b.avg_recent_points - a.avg_recent_points)
    .slice(0, limit);
}

/**
 * Get personalized alerts for a user
 */
export async function getPersonalizedAlerts(
  userId: number | string,
  limit: number = 5
): Promise<PersonalizedAlert[]> {
  const alerts: PersonalizedAlert[] = [];

  const priceGainsQuery = `
    SELECT 
      name,
      price_increment
    FROM players
    WHERE owner_id = $1 AND price_increment > 500000
    ORDER BY price_increment DESC
    LIMIT 2
  `;
  const priceGains = (await pgClient.query(priceGainsQuery, [userId])).rows;
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
      name,
      price_increment
    FROM players
    WHERE owner_id = $1 AND price_increment < -500000
    ORDER BY price_increment ASC
    LIMIT 2
  `;
  const priceLosses = (await pgClient.query(priceLossesQuery, [userId])).rows;
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
    )
    SELECT 
      p.name,
      prs.fantasy_points
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    WHERE p.owner_id = $1 
      AND prs.round_id = (SELECT max_round FROM LastRound)
      AND prs.fantasy_points >= 25
    ORDER BY prs.fantasy_points DESC
    LIMIT 1
  `;
  const goodForm = (await pgClient.query(recentGoodFormQuery, [userId])).rows[0];
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
