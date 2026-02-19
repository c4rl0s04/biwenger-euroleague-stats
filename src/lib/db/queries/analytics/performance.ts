import { db } from '../../client';

export interface VolatilityStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  avg_points: number;
  std_dev: number;
}

export interface PlacementStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  top_3_count: number;
  bottom_3_count: number;
  total_rounds: number;
}

export interface LeagueComparisonStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  above_avg_count: number;
  below_avg_count: number;
  avg_diff: number;
}

export interface EfficiencyStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  total_points: number;
  team_value: number;
  points_per_million: number;
}

export interface StreakStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  longest_streak: number;
  current_streak: number;
}

export interface BottlerStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  wins: number;
  seconds: number;
  thirds: number;
  bottler_score: number;
}

export interface HeartbreakerStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  count: number;
  total_diff: number;
}

export interface NoGloryStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  total_points_no_glory: number;
  rounds_count: number;
}

export interface JinxStat {
  user_id: number;
  name: string;
  icon: string;
  color_index: number;
  jinxed_count: number;
}

/**
 * Get volatility stats (Standard Deviation of points)
 * @returns {Promise<VolatilityStat[]>} Users sorted by consistency (lower std_dev is better)
 */
export async function getVolatilityStats(): Promise<VolatilityStat[]> {
  const query = `
    WITH Stats AS (
      SELECT 
        user_id,
        AVG(points) as avg_points,
        -- Postgres has STDDEV, but for consistency with previous manual calculation logic:
        STDDEV(points) as std_dev
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      ROUND(s.avg_points, 1) as avg_points,
      ROUND(s.std_dev, 2) as std_dev
    FROM users u
    JOIN Stats s ON u.id = s.user_id
    ORDER BY s.std_dev ASC
  `;
  // Note: Postgres `STDDEV` returns numeric/float, `ROUND` works fine.
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    avg_points: parseFloat(row.avg_points) || 0,
    std_dev: parseFloat(row.std_dev) || 0,
  }));
}

/**
 * Get placement stats (Top 3 vs Bottom 3 finishes)
 * @returns {Promise<PlacementStat[]>} Users with their podium and relegation zone counts
 */
export async function getPlacementStats(): Promise<PlacementStat[]> {
  const query = `
    WITH RoundRanks AS (
      SELECT 
        user_id,
        round_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position,
        COUNT(*) OVER (PARTITION BY round_id) as total_participants
      FROM user_rounds
      WHERE participated = TRUE
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      SUM(CASE WHEN r.position <= 3 THEN 1 ELSE 0 END) as top_3_count,
      SUM(CASE WHEN r.position >= (r.total_participants - 2) THEN 1 ELSE 0 END) as bottom_3_count,
      COUNT(r.round_id) as total_rounds
    FROM users u
    JOIN RoundRanks r ON u.id = r.user_id
    GROUP BY u.id
    ORDER BY top_3_count DESC, bottom_3_count ASC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    top_3_count: parseInt(row.top_3_count) || 0,
    bottom_3_count: parseInt(row.bottom_3_count) || 0,
    total_rounds: parseInt(row.total_rounds) || 0,
  }));
}

/**
 * Get league comparison stats (Rounds above/below league average)
 * @returns {Promise<LeagueComparisonStat[]>} Users with counts of above/below average rounds
 */
export async function getLeagueComparisonStats(): Promise<LeagueComparisonStat[]> {
  const query = `
    WITH RoundAverages AS (
      SELECT 
        round_id,
        AVG(points) as league_avg
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY round_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      SUM(CASE WHEN ur.points > ra.league_avg THEN 1 ELSE 0 END) as above_avg_count,
      SUM(CASE WHEN ur.points < ra.league_avg THEN 1 ELSE 0 END) as below_avg_count,
      ROUND(AVG(ur.points - ra.league_avg), 1) as avg_diff
    FROM users u
    JOIN user_rounds ur ON u.id = ur.user_id
    JOIN RoundAverages ra ON ur.round_id = ra.round_id
    WHERE ur.participated = TRUE
    GROUP BY u.id
    ORDER BY above_avg_count DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    above_avg_count: parseInt(row.above_avg_count) || 0,
    below_avg_count: parseInt(row.below_avg_count) || 0,
    avg_diff: parseFloat(row.avg_diff) || 0,
  }));
}

/**
 * Get efficiency stats (Points per Million)
 * Uses current team value as a proxy.
 * @returns {Promise<EfficiencyStat[]>} Users sorted by ROI
 */
export async function getEfficiencyStats(): Promise<EfficiencyStat[]> {
  const query = `
    WITH UserPoints AS (
      SELECT user_id, SUM(points) as total_points
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY user_id
    ),
    UserValue AS (
      SELECT owner_id, SUM(price) as team_value
      FROM players
      WHERE owner_id IS NOT NULL
      GROUP BY owner_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      up.total_points,
      COALESCE(uv.team_value, 0) as team_value,
      -- Calculate Points per 1M value
      ROUND(CAST(up.total_points AS NUMERIC) / NULLIF((CAST(uv.team_value AS NUMERIC) / 1000000), 0), 2) as points_per_million
    FROM users u
    JOIN UserPoints up ON u.id = up.user_id
    LEFT JOIN UserValue uv ON u.id = uv.owner_id
    WHERE uv.team_value > 0
    ORDER BY points_per_million DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    total_points: parseInt(row.total_points) || 0,
    team_value: parseInt(row.team_value) || 0,
    points_per_million: parseFloat(row.points_per_million) || 0,
  }));
}

/**
 * Get streak stats (Consecutive rounds with 175+ points)
 * @returns {Promise<StreakStat[]>} Users with their longest 175+ point streak
 */
export async function getStreakStats(): Promise<StreakStat[]> {
  const query = `
    WITH Scores AS (
      SELECT 
        user_id, 
        round_id, 
        CASE WHEN points >= 175 THEN 1 ELSE 0 END as is_high_score
      FROM user_rounds
      WHERE participated = TRUE
    ),
    Streaks AS (
      SELECT 
        user_id,
        round_id,
        is_high_score,
        SUM(CASE WHEN is_high_score = 0 THEN 1 ELSE 0 END) OVER (PARTITION BY user_id ORDER BY round_id) as grp
      FROM Scores
    ),
    GroupedStreaks AS (
      SELECT 
        user_id, 
        grp, 
        COUNT(*) as streak_length
      FROM Streaks
      WHERE is_high_score = 1
      GROUP BY user_id, grp
    ),
    RecentFailures AS (
      -- Find the most recent round where the user failed to score >= 175
      SELECT 
        user_id,
        MAX(round_id) as last_failure_round
      FROM user_rounds
      WHERE participated = TRUE AND points < 175
      GROUP BY user_id
    ),
    CurrentStreakCalc AS (
       -- Count rounds since the last failure
       SELECT
         ur.user_id,
         COUNT(*) as current_streak
       FROM user_rounds ur
       LEFT JOIN RecentFailures rf ON ur.user_id = rf.user_id
       WHERE ur.participated = TRUE 
         AND (rf.last_failure_round IS NULL OR ur.round_id > rf.last_failure_round)
       GROUP BY ur.user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COALESCE(MAX(gs.streak_length), 0) as longest_streak,
      COALESCE(csc.current_streak, 0) as current_streak
    FROM users u
    LEFT JOIN GroupedStreaks gs ON u.id = gs.user_id
    LEFT JOIN CurrentStreakCalc csc ON u.id = csc.user_id
    GROUP BY u.id, u.name, u.icon, u.color_index, csc.current_streak
    ORDER BY longest_streak DESC, current_streak DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    longest_streak: parseInt(row.longest_streak) || 0,
    current_streak: parseInt(row.current_streak) || 0,
  }));
}

/**
 * Get "Bottler" stats (High placed finishes without winning)
 * "Bottler Score" = (2nd_places * 3) + (3rd_places * 1) - (1st_places * 2)
 * High score means lots of near misses and few wins.
 * @returns {Promise<BottlerStat[]>} Users sorted by bottler score
 */
export async function getBottlerStats(): Promise<BottlerStat[]> {
  const query = `
    WITH RoundRanks AS (
      SELECT 
        user_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM user_rounds
      WHERE participated = TRUE
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN position = 2 THEN 1 ELSE 0 END) as seconds,
      SUM(CASE WHEN position = 3 THEN 1 ELSE 0 END) as thirds,
      (SUM(CASE WHEN position = 2 THEN 1 ELSE 0 END) * 3 + 
       SUM(CASE WHEN position = 3 THEN 1 ELSE 0 END) * 1) - 
       (SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) * 2)
       as bottler_score
    FROM users u
    JOIN RoundRanks r ON u.id = r.user_id
    GROUP BY u.id
    HAVING (SUM(CASE WHEN position = 2 THEN 1 ELSE 0 END) > 0 OR SUM(CASE WHEN position = 3 THEN 1 ELSE 0 END) > 0)
    ORDER BY bottler_score DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    wins: parseInt(row.wins) || 0,
    seconds: parseInt(row.seconds) || 0,
    thirds: parseInt(row.thirds) || 0,
    bottler_score: parseInt(row.bottler_score) || 0,
  }));
}

/**
 * Get Heartbreaker stats (Total margin of defeat in 2nd place finishes)
 * @returns {Promise<HeartbreakerStat[]>} Users sorted by total points missed by
 */
export async function getHeartbreakerStats(): Promise<HeartbreakerStat[]> {
  const refinedQuery = `
    WITH RoundRanks AS (
      SELECT 
        user_id,
        round_id,
        points,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position,
        MAX(points) OVER (PARTITION BY round_id) as winner_points
      FROM user_rounds
      WHERE participated = TRUE
    ),
    HeartbreakEvents AS (
      SELECT 
        user_id,
        round_id,
        (winner_points - points) as diff
      FROM RoundRanks
      WHERE position = 2
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COUNT(he.round_id) as count,
      COALESCE(SUM(he.diff), 0) as total_diff
    FROM users u
    LEFT JOIN HeartbreakEvents he ON u.id = he.user_id
    WHERE EXISTS (SELECT 1 FROM user_rounds ur WHERE ur.user_id = u.id AND ur.participated = TRUE) -- Only active users
    GROUP BY u.id
    ORDER BY (CASE WHEN COALESCE(SUM(he.diff), 0) = 0 THEN 1 ELSE 0 END) ASC, total_diff ASC
  `;
  return (await db.query(refinedQuery)).rows.map((row: any) => ({
    ...row,
    count: parseInt(row.count) || 0,
    total_diff: parseInt(row.total_diff) || 0,
  }));
}

/**
 * Get "No Glory" stats (Total points in non-winning rounds)
 * @returns {Promise<NoGloryStat[]>} Users sorted by points scored without winning
 */
export async function getNoGloryStats(): Promise<NoGloryStat[]> {
  const query = `
    WITH RoundRanks AS (
      SELECT 
        user_id,
        round_id,
        points,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM user_rounds
      WHERE participated = TRUE
    ),
    NoGloryEvents AS (
      SELECT 
        user_id,
        points
      FROM RoundRanks
      WHERE position > 1
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COALESCE(SUM(nge.points), 0) as total_points_no_glory,
      COUNT(nge.points) as rounds_count
    FROM users u
    LEFT JOIN NoGloryEvents nge ON u.id = nge.user_id
    WHERE EXISTS (SELECT 1 FROM user_rounds ur WHERE ur.user_id = u.id AND ur.participated = TRUE)
    GROUP BY u.id
    ORDER BY total_points_no_glory DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    total_points_no_glory: parseInt(row.total_points_no_glory) || 0,
    rounds_count: parseInt(row.rounds_count) || 0,
  }));
}

/**
 * Get "Jinx" stats (Above avg score but bottom half rank)
 * @returns {Promise<JinxStat[]>} Users sorted by count of "jinxed" rounds
 */
export async function getJinxStats(): Promise<JinxStat[]> {
  const query = `
    WITH RoundStats AS (
      SELECT 
        round_id,
        AVG(points) as league_avg,
        COUNT(user_id) as participant_count
      FROM user_rounds
      WHERE participated = TRUE
      GROUP BY round_id
    ),
    UserRoundsWithRank AS (
      SELECT 
        ur.user_id,
        ur.round_id,
        ur.points,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM user_rounds ur
      WHERE participated = TRUE
    ),
    JinxEvents AS (
      SELECT 
        urr.user_id,
        urr.round_id
      FROM UserRoundsWithRank urr
      JOIN RoundStats rs ON urr.round_id = rs.round_id
      WHERE urr.points > rs.league_avg 
        AND urr.position > (rs.participant_count / 2)
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COUNT(je.round_id) as jinxed_count
    FROM users u
    LEFT JOIN JinxEvents je ON u.id = je.user_id
    WHERE EXISTS (SELECT 1 FROM user_rounds ur WHERE ur.user_id = u.id AND ur.participated = TRUE)
    GROUP BY u.id
    ORDER BY jinxed_count DESC
  `;
  return (await db.query(query)).rows.map((row: any) => ({
    ...row,
    jinxed_count: parseInt(row.jinxed_count) || 0,
  }));
}
