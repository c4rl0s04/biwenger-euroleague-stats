import { db } from '../client.js';
import { CONFIG } from '../../config.js';
import { FUTURE_MATCH_CONDITION } from '../sql_utils.js';

/**
 * Get top performing players
 * @param {number} limit - Number of players
 * @returns {Promise<Array>} List of top players
 */
export async function getTopPlayers(limit = 6) {
  const query = `
    WITH FinishedRounds AS (
      SELECT m.round_id
      FROM matches m
      GROUP BY m.round_id
      HAVING COUNT(*) = SUM(CASE WHEN m.status = 'finished' THEN 1 ELSE 0 END)
      ORDER BY m.round_id DESC
      LIMIT 5
    ),
    PlayerRoundScores AS (
      SELECT 
        prs.player_id,
        prs.round_id,
        SUM(prs.fantasy_points) as round_points
      FROM player_round_stats prs
      WHERE prs.round_id IN (SELECT round_id FROM FinishedRounds)
      GROUP BY prs.player_id, prs.round_id
    ),
    RecentScores AS (
      SELECT 
        player_id,
        STRING_AGG(CAST(round_points AS TEXT), ',') as recent_scores
      FROM (
        SELECT player_id, round_id, round_points
        FROM PlayerRoundScores
        ORDER BY round_id DESC
      ) sub
      GROUP BY player_id
    )
    SELECT 
      p.id, p.name, t.id as team_id, t.name as team, p.position, p.price,
      p.puntos as points, 
      ROUND(CAST(p.puntos AS NUMERIC) / NULLIF(p.partidos_jugados, 0), 1) as average,
      u.name as owner_name, u.color_index as owner_color_index,
      rs.recent_scores
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN users u ON p.owner_id = u.id
    LEFT JOIN RecentScores rs ON p.id = rs.player_id
    ORDER BY p.puntos DESC 
    LIMIT $1
  `;
  return (await db.query(query, [limit])).rows.map((row) => ({
    ...row,
    average: parseFloat(row.average) || 0,
  }));
}

/**
 * Get top players by recent form (last N rounds)
 * @param {number} limit - Number of players to return
 * @param {number} rounds - Number of recent rounds to analyze
 * @returns {Promise<Array>} List of top performing players by form
 */
export async function getTopPlayersByForm(limit = 5, rounds = 3) {
  const query = `
    WITH RecentRounds AS (
      SELECT m.round_id
      FROM matches m
      GROUP BY m.round_id
      HAVING COUNT(*) = SUM(CASE WHEN m.status = 'finished' THEN 1 ELSE 0 END)
      ORDER BY m.round_id DESC
      LIMIT $1
    ),
    RoundCount AS (
      SELECT COUNT(*) as total_rounds FROM RecentRounds
    ),
    OrderedStats AS (
      SELECT prs.* FROM player_round_stats prs
      WHERE prs.round_id IN (SELECT round_id FROM RecentRounds)
      ORDER BY prs.round_id DESC
    ),
    PlayerFormStats AS (
      SELECT 
        os.player_id,
        p.name,
        p.position,
        t.id as team_id,
        t.name as team,
        p.owner_id,
        u.name as owner_name, u.color_index as owner_color_index,
        SUM(os.fantasy_points) as total_points,
        ROUND(SUM(os.fantasy_points) * 1.0 / (SELECT total_rounds FROM RoundCount), 1) as avg_points,
        COUNT(*) as games_played,
        STRING_AGG(CAST(os.fantasy_points AS TEXT), ',') as recent_scores
      FROM OrderedStats os
      JOIN players p ON os.player_id = p.id
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN users u ON p.owner_id = u.id
      GROUP BY os.player_id, p.name, p.position, t.id, t.name, p.owner_id, u.name, u.color_index
      HAVING COUNT(*) >= 2
    )
    SELECT 
      player_id,
      name,
      position,
      team_id,
      team,
      owner_id,
      owner_name,
      owner_color_index,
      total_points,
      avg_points,
      games_played,
      recent_scores
    FROM PlayerFormStats
    ORDER BY avg_points DESC, total_points DESC
    LIMIT $2
  `;

  return (await db.query(query, [rounds, limit])).rows.map((row) => ({
    ...row,
    avg_points: parseFloat(row.avg_points) || 0,
  }));
}

/**
 * Get detailed player information by ID
 * @param {number} playerId - Player ID
 * @returns {Promise<Object>} Player details including stats
 */
export async function getPlayerDetails(playerId) {
  // 1. Base Player Info
  const query = `
    SELECT 
      p.*,
      u.name as owner_name, u.color_index as owner_color_index,
      (SELECT COUNT(*) FROM player_round_stats WHERE player_id = p.id) as games_played,
      (SELECT ROUND(AVG(fantasy_points), 1) FROM player_round_stats WHERE player_id = p.id) as season_avg,
      (SELECT SUM(fantasy_points) FROM player_round_stats WHERE player_id = p.id) as total_points,
      t.id as team_id,
      t.name as team
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = $1
  `;

  const playerRes = await db.query(query, [playerId]);
  const player = playerRes.rows[0];

  if (!player) return null;

  // 2. Matches History
  const matchesQuery = `
    SELECT 
      m.round_id,
      m.round_name,
      m.date as match_date,
      th.name as home_team,
      ta.name as away_team,
      m.home_score,
      m.away_score,
      prs.fantasy_points,
      prs.minutes as minutes_played,
      prs.points as points_scored,
      prs.rebounds,
      prs.assists,
      prs.steals,
      prs.blocks,
      prs.turnovers,
      prs.two_points_made,
      prs.two_points_attempted,
      prs.three_points_made,
      prs.three_points_attempted,
      prs.free_throws_made,
      prs.free_throws_attempted,
      prs.fouls_committed
    FROM matches m
    JOIN players p ON p.id = $1
    LEFT JOIN teams th ON m.home_id = th.id
    LEFT JOIN teams ta ON m.away_id = ta.id
    LEFT JOIN player_round_stats prs ON m.round_id = prs.round_id AND prs.player_id = p.id
    WHERE (m.home_id = p.team_id OR m.away_id = p.team_id)
      AND m.date < NOW()
    ORDER BY m.round_id DESC
  `;

  const recentMatches = (await db.query(matchesQuery, [playerId])).rows;

  // 3. Price History
  const priceHistoryQuery = `
    SELECT date, price 
    FROM market_values 
    WHERE player_id = $1 
    ORDER BY date ASC
  `;
  const priceHistory = (await db.query(priceHistoryQuery, [playerId])).rows;

  // 4. Ownership History (Transfers)
  const transfersQuery = `
    SELECT 
      f.fecha as date, 
      f.vendedor as from_name, 
      f.comprador as to_name, 
      f.precio as amount,
      u1.icon as from_img,
      u2.icon as to_img
    FROM fichajes f
    LEFT JOIN users u1 ON f.vendedor = u1.name
    LEFT JOIN users u2 ON f.comprador = u2.name
    WHERE f.player_id = $1 
    ORDER BY f.timestamp DESC
  `;
  const transfers = (await db.query(transfersQuery, [playerId])).rows;

  // Check for Initial Squad Assignment
  const initialSquadQuery = `
    SELECT 
      u.name as owner_name, u.color_index as owner_color_index, 
      u.icon as owner_img 
    FROM initial_squads s
    JOIN users u ON s.user_id = u.id
    WHERE s.player_id = $1
  `;
  const initialOwnerRes = await db.query(initialSquadQuery, [playerId]);
  const initialOwner = initialOwnerRes.rows[0];

  if (initialOwner) {
    let initialDate = new Date(CONFIG.LEAGUE.START_DATE).toISOString();
    if (transfers.length > 0) {
      const oldestTransfer = new Date(transfers[transfers.length - 1].date);
      oldestTransfer.setHours(oldestTransfer.getHours() - 24);
      initialDate = oldestTransfer.toISOString();
    }

    transfers.push({
      date: initialDate,
      from_name: 'Biwenger',
      to_name: initialOwner.owner_name,
      amount: 0,
      from_img: null,
      to_img: initialOwner.owner_img,
    });
  }

  // 5. Next Match
  // Use Postgres NOW()
  const nextMatchQuery = `
    SELECT 
      date, 
      th.name as home_team, 
      ta.name as away_team,
      round_name
    FROM matches m
    LEFT JOIN teams th ON m.home_id = th.id
    LEFT JOIN teams ta ON m.away_id = ta.id
    WHERE (m.home_id = $1 OR m.away_id = $2) 
      AND ${FUTURE_MATCH_CONDITION('date')} 
    ORDER BY date ASC 
    LIMIT 1
  `;
  const nextMatchRes = await db.query(nextMatchQuery, [player.team_id, player.team_id]);
  const nextMatch = nextMatchRes.rows[0];

  // 6. Advanced Stats Aggregates (Season Totals)
  const advancedStats = recentMatches.reduce(
    (acc, m) => {
      acc.two_points_made += m.two_points_made || 0;
      acc.two_points_attempted += m.two_points_attempted || 0;
      acc.three_points_made += m.three_points_made || 0;
      acc.three_points_attempted += m.three_points_attempted || 0;
      acc.free_throws_made += m.free_throws_made || 0;
      acc.free_throws_attempted += m.free_throws_attempted || 0;
      acc.blocks += m.blocks || 0;
      acc.turnovers += m.turnovers || 0;
      acc.fouls += m.fouls_committed || 0;
      return acc;
    },
    {
      two_points_made: 0,
      two_points_attempted: 0,
      three_points_made: 0,
      three_points_attempted: 0,
      free_throws_made: 0,
      free_throws_attempted: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
    }
  );

  return {
    ...player,
    recentMatches,
    priceHistory,
    transfers,
    nextMatch,
    advancedStats,
  };
}

/**
 * Get players with birthdays today
 * @returns {Promise<Array>} Players celebrating birthdays
 */
export async function getPlayersBirthday() {
  const query = `
    SELECT 
      p.id,
      p.name,
      t.id as team_id,
      t.name as team,
      p.position,
      p.birth_date,
      u.name as owner_name, u.color_index as owner_color_index
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.birth_date IS NOT NULL
      AND TO_CHAR(CAST(p.birth_date AS DATE), 'MM-DD') = TO_CHAR(NOW(), 'MM-DD')
    ORDER BY p.name
  `;

  return (await db.query(query)).rows;
}

/**
 * Get players on hot or cold streaks
 * @param {number} minGames - Minimum games for streak
 * @returns {Promise<Object>} Hot and cold players
 */
export async function getPlayerStreaks(minGames = 3) {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      ORDER BY round_id DESC
      LIMIT 5
    ),
    PlayerRecentForm AS (
      SELECT 
        prs.player_id,
        p.name,
        t.id as team_id,
        t.name as team,
        p.position,
        COUNT(*) as games,
        AVG(prs.fantasy_points) as recent_avg,
        p.owner_id,
        u.name as owner_name, u.color_index as owner_color_index
      FROM player_round_stats prs
      JOIN players p ON prs.player_id = p.id
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE prs.round_id IN (SELECT round_id FROM RecentRounds)
      GROUP BY prs.player_id, p.name, t.id, t.name, p.position, p.owner_id, u.name, u.color_index
      HAVING COUNT(*) >= $1
    ),
    SeasonAvg AS (
      SELECT 
        player_id,
        AVG(fantasy_points) as season_avg
      FROM player_round_stats
      GROUP BY player_id
    )
    SELECT 
      prf.player_id,
      prf.name,
      prf.team_id,
      prf.team,
      prf.position,
      prf.games,
      prf.recent_avg,
      prf.owner_id,
      prf.owner_name,
      prf.owner_color_index,
      COALESCE(sa.season_avg, 0) as season_avg,
      ROUND(prf.recent_avg - COALESCE(sa.season_avg, 0), 1) as avg_diff,
      ROUND((prf.recent_avg - COALESCE(sa.season_avg, 0)) / NULLIF(sa.season_avg, 1) * 100, 1) as trend_pct
    FROM PlayerRecentForm prf
    LEFT JOIN SeasonAvg sa ON prf.player_id = sa.player_id
    ORDER BY ABS(prf.recent_avg - COALESCE(sa.season_avg, 0)) DESC
    LIMIT 20
  `;

  const allPlayers = (await db.query(query, [minGames])).rows.map((p) => ({
    ...p,
    recent_avg: parseFloat(p.recent_avg) || 0,
    season_avg: parseFloat(p.season_avg) || 0,
    avg_diff: parseFloat(p.avg_diff) || 0,
    trend_pct: parseFloat(p.trend_pct) || 0,
  }));

  return {
    hot: allPlayers.filter((p) => p.trend_pct > 20).slice(0, 5),
    cold: allPlayers.filter((p) => p.trend_pct < -20).slice(0, 5),
  };
}

/**
 * Get players showing improvement trend
 * @param {number} limit - Number of rising stars
 * @returns {Promise<Array>} Players with improving performance
 */
export async function getRisingStars(limit = 5) {
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      ORDER BY round_id DESC
      LIMIT 5
    ),
    EarlierRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      WHERE round_id NOT IN (SELECT round_id FROM RecentRounds)
      ORDER BY round_id DESC
      LIMIT 5
    ),
    RecentPerformance AS (
      SELECT 
        player_id,
        AVG(fantasy_points) as recent_avg,
        COUNT(*) as recent_games
      FROM player_round_stats
      WHERE round_id IN (SELECT round_id FROM RecentRounds)
      GROUP BY player_id
      HAVING COUNT(*) >= 3
    ),
    EarlierPerformance AS (
      SELECT 
        player_id,
        AVG(fantasy_points) as earlier_avg
      FROM player_round_stats
      WHERE round_id IN (SELECT round_id FROM EarlierRounds)
      GROUP BY player_id
    )
    SELECT 
      p.id as player_id,
      p.name,
      t.id as team_id,
      t.name as team,
      p.position,
      rp.recent_avg,
      COALESCE(ep.earlier_avg, 0) as earlier_avg,
      ROUND(rp.recent_avg - COALESCE(ep.earlier_avg, 0), 1) as improvement,
      ROUND((rp.recent_avg - COALESCE(ep.earlier_avg, 0)) / NULLIF(ep.earlier_avg, 1) * 100, 1) as improvement_pct,
      u.name as owner_name, u.color_index as owner_color_index
    FROM RecentPerformance rp
    JOIN players p ON rp.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN EarlierPerformance ep ON rp.player_id = ep.player_id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE rp.recent_avg > COALESCE(ep.earlier_avg, 0)
      AND (rp.recent_avg - COALESCE(ep.earlier_avg, 0)) >= 3
    ORDER BY improvement DESC
    LIMIT $1
  `;

  return (await db.query(query, [limit])).rows.map((row) => ({
    ...row,
    recent_avg: parseFloat(row.recent_avg) || 0,
    earlier_avg: parseFloat(row.earlier_avg) || 0,
    improvement: parseFloat(row.improvement) || 0,
    improvement_pct: parseFloat(row.improvement_pct) || 0,
  }));
}

/**
 * Get all players with basic stats for the players list
 * @returns {Promise<Array>} List of all players
 */
export async function getAllPlayers() {
  const query = `
    WITH PlayerRoundScores AS (
       SELECT 
         player_id, 
         round_id, 
         fantasy_points
       FROM player_round_stats
     ),
     RecentScores AS (
       SELECT 
         player_id,
         STRING_AGG(CAST(fantasy_points AS TEXT), ',') as recent_scores
       FROM (
         SELECT 
           player_id, 
           fantasy_points,
           ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY round_id DESC) as rn
         FROM PlayerRoundScores
       ) sub
       WHERE rn <= 5
       GROUP BY player_id
     )
     SELECT 
       p.id,
       p.name,
       p.img,
       p.position,
       p.price,
       p.price_increment,
       p.team_id,
       t.name as team_name,
       t.short_name as team_short_name,
       t.img as team_img,

       p.owner_id,
       u.name as owner_name, u.color_index as owner_color_index,
       u.icon as owner_icon,
       p.puntos as total_points,
       p.partidos_jugados as played,
       ROUND(CAST(p.puntos AS NUMERIC) / NULLIF(p.partidos_jugados, 0), 1) as average,
       p.status,
       rs.recent_scores
     FROM players p
     LEFT JOIN teams t ON p.team_id = t.id
     LEFT JOIN users u ON p.owner_id = u.id
     LEFT JOIN RecentScores rs ON p.id = rs.player_id
     ORDER BY p.puntos DESC
  `;
  return (await db.query(query)).rows.map((p) => ({
    ...p,
    average: parseFloat(p.average) || 0,
  }));
}
