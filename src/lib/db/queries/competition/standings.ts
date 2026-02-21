import { db } from '../../index';
import { users, userRounds, players, matches } from '../../schema';
import { sql } from 'drizzle-orm';

export async function getExtendedStandings(
  options: { sortBy?: string; direction?: 'asc' | 'desc' } = {}
) {
  const { sortBy = 'total_points', direction = 'desc' } = options;

  const sortDir = direction === 'asc' ? sql`ASC` : sql`DESC`;

  // Safe whitelist mapping for sort columns
  const sortMap: Record<string, any> = {
    position: sql`position`,
    total_points: sql`total_points`,
    avg_points: sql`avg_points`,
    round_wins: sql`round_wins`,
    team_value: sql`team_value`,
    price_trend: sql`price_trend`,
    rounds_played: sql`rounds_played`,
    best_round: sql`best_round`,
    worst_round: sql`worst_round`,
    name: sql`u.name`,
  };

  const orderBy = sortMap[sortBy] || sortMap.total_points;

  const result = await db.execute(sql`
    WITH UserTotals AS (
      SELECT 
        user_id,
        SUM(points) as total_points,
        COUNT(*) as rounds_played,
        ROUND(AVG(points), 1) as avg_points,
        MAX(points) as best_round,
        MIN(points) as worst_round
      FROM ${userRounds}
      WHERE ${userRounds.participated} = TRUE
      GROUP BY user_id
    ),
    RoundWins AS (
      SELECT 
        user_id,
        COUNT(*) as wins
      FROM (
        SELECT 
          user_id,
          points,
          RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
        FROM ${userRounds}
        WHERE ${userRounds.participated} = TRUE
      ) sub
      WHERE position = 1
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COALESCE(ut.total_points, 0)::int as total_points,
      COALESCE(ut.rounds_played, 0)::int as rounds_played,
      COALESCE(ut.avg_points, 0)::float as avg_points,
      COALESCE(ut.best_round, 0)::int as best_round,
      COALESCE(ut.worst_round, 0)::int as worst_round,
      COALESCE(rw.wins, 0)::int as round_wins,
      COALESCE(sq.team_value, 0)::int as team_value,
      COALESCE(sq.price_trend, 0)::int as price_trend,
      RANK() OVER (ORDER BY COALESCE(ut.total_points, 0) DESC)::int as position
    FROM ${users} u
    LEFT JOIN UserTotals ut ON u.id = ut.user_id
    LEFT JOIN RoundWins rw ON u.id = rw.user_id
    LEFT JOIN (
      SELECT 
        owner_id, 
        SUM(price) as team_value,
        SUM(price_increment) as price_trend
      FROM ${players}
      WHERE owner_id IS NOT NULL
      GROUP BY owner_id
    ) sq ON u.id = sq.owner_id
    ORDER BY ${orderBy} ${sortDir} NULLS LAST
  `);

  return result.rows;
}

export async function getRoundWinners(limit = 15) {
  const result = await db.execute(sql`
    WITH RoundResults AS (
      SELECT 
        ur.round_id,
        ur.round_name,
        ur.user_id,
        u.name,
        u.icon,
        u.color_index,
        ur.points,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM ${userRounds} ur
      JOIN ${users} u ON ur.user_id = u.id
      WHERE ur.participated = TRUE
    )
    SELECT 
      round_id,
      round_name,
      user_id,
      name,
      icon,
      color_index,
      points
    FROM RoundResults
    WHERE position = 1
    ORDER BY round_id DESC
    LIMIT ${limit}
  `);

  return result.rows;
}

export async function getLeagueTotals() {
  const pointsStats = (
    await db.execute(sql`
    SELECT 
      SUM(points)::int as total_points,
      ROUND(AVG(points), 1)::float as avg_round_points,
      COUNT(DISTINCT round_id)::int as total_rounds,
      COUNT(DISTINCT user_id)::int as total_users
    FROM ${userRounds}
    WHERE participated = TRUE
  `)
  ).rows[0];

  const seasonRounds = (
    await db.execute(sql`
    SELECT COUNT(DISTINCT 
      CASE 
        WHEN round_name LIKE '%(aplazada)%' THEN TRIM(REPLACE(round_name, '(aplazada)', ''))
        ELSE round_name
      END
    )::int as total_season_rounds
    FROM ${matches}
  `)
  ).rows[0];

  const valueStats = (
    await db.execute(sql`
    SELECT 
      SUM(sq.team_value)::bigint as total_league_value,
      MAX(sq.team_value)::bigint as max_team_value,
      MIN(sq.team_value)::bigint as min_team_value
    FROM (
      SELECT owner_id, SUM(price) as team_value
      FROM ${players}
      WHERE owner_id IS NOT NULL
      GROUP BY owner_id
    ) sq
  `)
  ).rows[0];

  const mostValuable = (
    await db.execute(sql`
    SELECT 
      u.name,
      u.icon,
      u.color_index,
      SUM(p.price)::bigint as team_value
    FROM ${players} p
    JOIN ${users} u ON p.owner_id = u.id
    WHERE p.owner_id IS NOT NULL
    GROUP BY p.owner_id, u.name, u.icon, u.color_index
    ORDER BY team_value DESC
    LIMIT 1
  `)
  ).rows[0];

  const roundRecord = (
    await db.execute(sql`
    SELECT 
      ur.user_id,
      u.name,
      u.icon,
      u.color_index,
      ur.round_name,
      ur.points
    FROM ${userRounds} ur
    JOIN ${users} u ON ur.user_id = u.id
    WHERE ur.participated = TRUE
    ORDER BY ur.points DESC
    LIMIT 1
  `)
  ).rows[0];

  // Leader Streak Logic
  let leaderStreak = { streak: 0 };
  try {
    const res = await db.execute(sql`
      WITH CurrentLeader AS (
        SELECT user_id
        FROM (
          SELECT user_id, SUM(points) as total
          FROM ${userRounds}
          WHERE participated = TRUE
          GROUP BY user_id
          ORDER BY total DESC
          LIMIT 1
        ) sub
      ),
      LeagueRounds AS (
        SELECT DISTINCT round_id 
        FROM ${userRounds} 
        WHERE participated = TRUE
      ),
      RoundRanks AS (
        SELECT 
          round_id,
          user_id,
          RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
        FROM ${userRounds}
        WHERE participated = TRUE
      ),
      LeaderPerformance AS (
        SELECT 
          lr.round_id,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM RoundRanks rr 
              WHERE rr.round_id = lr.round_id 
              AND rr.user_id = (SELECT user_id FROM CurrentLeader)
              AND rr.position = 1
            ) THEN 1 
            ELSE 0 
          END as is_win
        FROM LeagueRounds lr
      ),
      CalculatedStreak AS (
        SELECT 
          round_id,
          is_win,
          SUM(CASE WHEN is_win = 0 THEN 1 ELSE 0 END) OVER (ORDER BY round_id DESC) as grp
        FROM LeaderPerformance
      )
      SELECT COUNT(*)::int as streak
      FROM CalculatedStreak
      WHERE grp = 0 AND is_win = 1
    `);
    if (res.rows.length > 0) leaderStreak = res.rows[0] as { streak: number };
  } catch (e) {
    console.error('Leader Streak Query Error', e);
  }

  return {
    ...pointsStats,
    ...valueStats,
    total_season_rounds: seasonRounds?.total_season_rounds || 34,
    most_valuable_user: mostValuable,
    round_record: roundRecord,
    leader_streak: leaderStreak.streak || 0,
  };
}

export async function getPointsProgression(limit = 10) {
  const result = await db.execute(sql`
    WITH RecentRounds AS (
      SELECT DISTINCT round_id, round_name
      FROM ${userRounds}
      ORDER BY round_id DESC
      LIMIT ${limit}
    )
    SELECT 
      ur.user_id,
      u.name,
      u.color_index,
      ur.round_id,
      ur.round_name,
      CASE WHEN ur.participated = TRUE THEN ur.points ELSE 0 END as points,
      SUM(CASE WHEN ur.participated = TRUE THEN ur.points ELSE 0 END) OVER (PARTITION BY ur.user_id ORDER BY ur.round_id)::int as cumulative_points
    FROM ${userRounds} ur
    JOIN ${users} u ON ur.user_id = u.id
    WHERE ur.round_id IN (SELECT round_id FROM RecentRounds)
    ORDER BY ur.round_id ASC, ur.points DESC
  `);

  return result.rows;
}

export async function getValueRanking() {
  const result = await db.execute(sql`
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COALESCE(SUM(p.price), 0)::bigint as team_value,
      COALESCE(SUM(p.price_increment), 0)::int as price_trend,
      COUNT(p.id)::int as squad_size,
      RANK() OVER (ORDER BY COALESCE(SUM(p.price), 0) DESC)::int as value_position
    FROM ${users} u
    LEFT JOIN ${players} p ON u.id = p.owner_id
    GROUP BY u.id
    ORDER BY team_value DESC
  `);

  return result.rows;
}

export async function getWinCounts() {
  const result = await db.execute(sql`
    WITH RoundWinners AS (
      SELECT 
        user_id,
        round_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM ${userRounds}
      WHERE participated = TRUE
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COUNT(rw.round_id)::int as wins
    FROM ${users} u
    LEFT JOIN RoundWinners rw ON u.id = rw.user_id AND rw.position = 1
    GROUP BY u.id
    ORDER BY wins DESC
  `);

  return result.rows;
}

export async function getSimpleStandings() {
  const result = await db.execute(sql`
    WITH UserTotals AS (
      SELECT 
        user_id,
        SUM(points) as total_points
      FROM ${userRounds}
      WHERE participated = TRUE
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      u.name,
      u.icon,
      u.color_index,
      COALESCE(ut.total_points, 0)::int as total_points,
      COALESCE(sq.team_value, 0)::bigint as team_value,
      COALESCE(sq.price_trend, 0)::int as price_trend,
      RANK() OVER (ORDER BY COALESCE(ut.total_points, 0) DESC)::int as position
    FROM ${users} u
    LEFT JOIN UserTotals ut ON u.id = ut.user_id
    LEFT JOIN (
      SELECT 
        owner_id, 
        SUM(price) as team_value,
        SUM(price_increment) as price_trend
      FROM ${players}
      WHERE owner_id IS NOT NULL
      GROUP BY owner_id
    ) sq ON u.id = sq.owner_id
    ORDER BY position ASC
  `);

  return result.rows;
}

export async function getLeaderComparison(userId: string) {
  // Reuse our own getSimpleStandings
  const standings = await getSimpleStandings();
  const leader = standings[0];
  const secondPlace = standings[1];

  // Ensure we compare strings properly if IDs are mixed types in DB/JS
  // Drizzle result rows are untyped ‘any’ by default unless mapped, but we know the shape.
  const user = standings.find((u: any) => String(u.user_id) === String(userId));

  if (!user || !leader) return null;

  // Cast for safety
  const leaderPoints = (leader as any).total_points;
  const userPoints = (user as any).total_points;

  const gap = leaderPoints - userPoints;
  const pos = (user as any).position;
  const roundsNeeded = pos > 1 ? Math.ceil(gap / 10) : 0;

  const gapToSecond = pos === 1 && secondPlace ? userPoints - (secondPlace as any).total_points : 0;

  return {
    leader_name: (leader as any).name,
    leader_points: leaderPoints,
    user_points: userPoints,
    gap: gap,
    gap_to_second: gapToSecond,
    rounds_needed: roundsNeeded,
    is_leader: pos === 1,
  };
}

export async function getLeagueAveragePoints() {
  const result = await db.execute(sql`
    SELECT ROUND(AVG(points), 1)::float as avg_points
    FROM ${userRounds}
    WHERE participated = TRUE
  `);

  return result.rows[0] ? result.rows[0].avg_points : 0;
}
