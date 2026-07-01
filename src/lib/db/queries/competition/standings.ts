import { db } from '../../index';
import { matches, playerSeasons, userRounds, users, userSeasons } from '../../schema';
import { resolveReadSeasonId } from '../../season-context';
import { sql } from 'drizzle-orm';

export async function getExtendedStandings(
  options: { sortBy?: string; direction?: 'asc' | 'desc' } = {}
) {
  const seasonId = await resolveReadSeasonId();
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
    name: sql`name`,
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
      WHERE ${userRounds.seasonId} = ${seasonId}
        AND ${userRounds.participated} = TRUE
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
        WHERE ${userRounds.seasonId} = ${seasonId}
          AND ${userRounds.participated} = TRUE
      ) sub
      WHERE position = 1
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      COALESCE(us.name, u.name) as name,
      COALESCE(us.icon, u.icon) as icon,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      COALESCE(ut.total_points, 0)::int as total_points,
      COALESCE(ut.rounds_played, 0)::int as rounds_played,
      COALESCE(ut.avg_points, 0)::float as avg_points,
      COALESCE(ut.best_round, 0)::int as best_round,
      COALESCE(ut.worst_round, 0)::int as worst_round,
      COALESCE(rw.wins, 0)::int as round_wins,
      COALESCE(sq.team_value, 0)::int as team_value,
      COALESCE(sq.price_trend, 0)::int as price_trend,
      RANK() OVER (ORDER BY COALESCE(ut.total_points, 0) DESC)::int as position
    FROM ${userSeasons} us
    JOIN ${users} u ON u.id = us.user_id
    LEFT JOIN UserTotals ut ON u.id = ut.user_id
    LEFT JOIN RoundWins rw ON u.id = rw.user_id
    LEFT JOIN (
      SELECT 
        owner_id, 
        SUM(price) as team_value,
        SUM(price_increment) as price_trend
      FROM ${playerSeasons}
      WHERE season_id = ${seasonId} AND owner_id IS NOT NULL
      GROUP BY owner_id
    ) sq ON u.id = sq.owner_id
    WHERE us.season_id = ${seasonId}
      AND COALESCE(us.status, 'active') = 'active'
    ORDER BY ${orderBy} ${sortDir} NULLS LAST
  `);

  return result.rows;
}

export async function getRoundWinners(limit = 15) {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    WITH RoundResults AS (
      SELECT 
        ur.round_id,
        ur.round_name,
        ur.user_id,
        COALESCE(us.name, u.name) as name,
        COALESCE(us.icon, u.icon) as icon,
        COALESCE(us.color_index, u.color_index, 0) as color_index,
        ur.points,
        RANK() OVER (PARTITION BY ur.round_id ORDER BY ur.points DESC) as position
      FROM ${userRounds} ur
      JOIN ${users} u ON ur.user_id = u.id
      JOIN ${userSeasons} us ON us.user_id = u.id AND us.season_id = ur.season_id
      WHERE ur.season_id = ${seasonId}
        AND ur.participated = TRUE
        AND COALESCE(us.status, 'active') = 'active'
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
  const seasonId = await resolveReadSeasonId();
  // Query for general stats filtered by COMPLETED rounds
  const statistics = await db.execute(sql`
    WITH CompletedRounds AS (
      SELECT round_id
      FROM ${matches}
      WHERE season_id = ${seasonId}
      GROUP BY round_id
      HAVING COUNT(*) = COUNT(CASE WHEN status = 'finished' THEN 1 END)
    )
    SELECT 
      SUM(points)::int as total_points,
      COUNT(DISTINCT round_id)::int as total_rounds,
      (
        SELECT COUNT(*)
        FROM ${userSeasons}
        WHERE season_id = ${seasonId}
          AND COALESCE(status, 'active') = 'active'
      )::int as total_users
    FROM ${userRounds}
    WHERE season_id = ${seasonId}
    AND participated = TRUE
    AND round_id IN (SELECT round_id FROM CompletedRounds)
  `);

  const pointsStats = statistics.rows[0] as {
    total_points: number;
    total_rounds: number;
    total_users: number;
  };

  const valueStats = (
    await db.execute(sql`
    SELECT 
      SUM(team_value)::bigint as total_league_value,
      MAX(team_value)::bigint as max_team_value,
      MIN(team_value)::bigint as min_team_value
    FROM (
      SELECT owner_id, SUM(price) as team_value
      FROM ${playerSeasons}
      WHERE season_id = ${seasonId} AND owner_id IS NOT NULL
      GROUP BY owner_id
    ) t
  `)
  ).rows[0] as {
    total_league_value: string;
    max_team_value: string;
    min_team_value: string;
  };

  const seasonRounds = (
    await db.execute(sql`
    SELECT COUNT(DISTINCT round_id)::int as total_season_rounds
    FROM ${matches}
    WHERE season_id = ${seasonId}
  `)
  ).rows[0] as { total_season_rounds: number };

  const mostValuable = (
    await db.execute(sql`
    SELECT 
      COALESCE(us.name, u.name) as name,
      COALESCE(us.icon, u.icon) as icon,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      SUM(ps.price)::bigint as team_value
    FROM ${userSeasons} us
    JOIN ${users} u ON u.id = us.user_id
    JOIN ${playerSeasons} ps ON u.id = ps.owner_id AND ps.season_id = us.season_id
    WHERE us.season_id = ${seasonId}
      AND COALESCE(us.status, 'active') = 'active'
    GROUP BY u.id, us.name, us.icon, us.color_index
    ORDER BY team_value DESC
    LIMIT 1
  `)
  ).rows[0];

  const roundRecord = (
    await db.execute(sql`
    WITH CompletedRounds AS (
      SELECT round_id
      FROM ${matches}
      WHERE season_id = ${seasonId}
      GROUP BY round_id
      HAVING COUNT(*) = COUNT(CASE WHEN status = 'finished' THEN 1 END)
    )
    SELECT 
      ur.user_id,
      COALESCE(us.name, u.name) as name,
      COALESCE(us.icon, u.icon) as icon,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      ur.round_name,
      ur.points
    FROM ${userRounds} ur
    JOIN ${users} u ON ur.user_id = u.id
    JOIN ${userSeasons} us ON us.user_id = u.id AND us.season_id = ur.season_id
    WHERE ur.round_id IN (SELECT round_id FROM CompletedRounds)
    AND ur.season_id = ${seasonId}
    AND COALESCE(us.status, 'active') = 'active'
    ORDER BY ur.points DESC
    LIMIT 1
  `)
  ).rows[0];

  let leaderStreak = { streak: 0 };
  try {
    const res = await db.execute(sql`
      WITH CompletedRounds AS (
        SELECT round_id
        FROM ${matches}
        WHERE season_id = ${seasonId}
        GROUP BY round_id
        HAVING COUNT(*) = COUNT(CASE WHEN status = 'finished' THEN 1 END)
      ),
      RoundWinners AS (
        SELECT 
          round_id,
          user_id,
          RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as pos
        FROM ${userRounds}
        WHERE participated = TRUE
        AND season_id = ${seasonId}
        AND round_id IN (SELECT round_id FROM CompletedRounds)
      ),
      LatestCompletedRound AS (
        SELECT MAX(round_id) as rid FROM CompletedRounds
      ),
      TargetUser AS (
        SELECT ur.user_id, COALESCE(us.name, u.name) as name
        FROM RoundWinners ur
        JOIN ${users} u ON ur.user_id = u.id
        JOIN ${userSeasons} us ON us.user_id = u.id AND us.season_id = ${seasonId}
        WHERE ur.pos = 1 
        AND ur.round_id = (SELECT rid FROM LatestCompletedRound)
        AND COALESCE(us.status, 'active') = 'active'
        LIMIT 1
      ),
      WinningRounds AS (
        SELECT 
          r.round_id,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM RoundWinners rw 
              WHERE rw.round_id = r.round_id 
              AND rw.user_id = (SELECT user_id FROM TargetUser)
              AND rw.pos = 1
            ) THEN 1 
            ELSE 0 
          END as is_win
        FROM CompletedRounds r
      ),
      StreakCalc AS (
        SELECT 
          round_id,
          is_win,
          SUM(CASE WHEN is_win = 0 THEN 1 ELSE 0 END) OVER (ORDER BY round_id DESC) as grp
        FROM WinningRounds
      )
      SELECT 
        COUNT(*)::int as streak
      FROM StreakCalc
      WHERE grp = 0 AND is_win = 1
    `);
    if (res.rows.length > 0) {
      leaderStreak = res.rows[0] as { streak: number };
    }
  } catch (e) {
    console.error('Winner Streak Query Error', e);
  }

  const result = {
    ...pointsStats,
    ...valueStats,
    avg_round_points:
      pointsStats.total_rounds > 0
        ? Number(
            (
              pointsStats.total_points /
              pointsStats.total_rounds /
              (pointsStats.total_users || 1)
            ).toFixed(1)
          )
        : 0,
    total_season_rounds: seasonRounds?.total_season_rounds || 34,
    most_valuable_user: mostValuable,
    round_record: roundRecord,
    winner_streak: Number(leaderStreak.streak) || 0,
  };

  return result;
}

export async function getPointsProgression(limit = 10) {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    WITH RecentRounds AS (
      SELECT DISTINCT round_id, round_name
      FROM ${userRounds}
      WHERE season_id = ${seasonId}
      ORDER BY round_id DESC
      LIMIT ${limit}
    )
    SELECT 
      ur.user_id,
      COALESCE(us.name, u.name) as name,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      ur.round_id,
      ur.round_name,
      CASE WHEN ur.participated = TRUE THEN ur.points ELSE 0 END as points,
      SUM(CASE WHEN ur.participated = TRUE THEN ur.points ELSE 0 END) OVER (PARTITION BY ur.user_id ORDER BY ur.round_id)::int as cumulative_points
    FROM ${userRounds} ur
    JOIN ${users} u ON ur.user_id = u.id
    JOIN ${userSeasons} us ON us.user_id = u.id AND us.season_id = ur.season_id
    WHERE ur.round_id IN (SELECT round_id FROM RecentRounds)
    AND ur.season_id = ${seasonId}
    AND COALESCE(us.status, 'active') = 'active'
    ORDER BY ur.round_id ASC, ur.points DESC
  `);

  return result.rows;
}

export async function getValueRanking() {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    SELECT 
      u.id as user_id,
      COALESCE(us.name, u.name) as name,
      COALESCE(us.icon, u.icon) as icon,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      COALESCE(SUM(ps.price), 0)::bigint as team_value,
      COALESCE(SUM(ps.price_increment), 0)::int as price_trend,
      COUNT(ps.player_id)::int as squad_size,
      RANK() OVER (ORDER BY COALESCE(SUM(ps.price), 0) DESC)::int as value_position
    FROM ${userSeasons} us
    JOIN ${users} u ON u.id = us.user_id
    LEFT JOIN ${playerSeasons} ps ON u.id = ps.owner_id AND ps.season_id = us.season_id
    WHERE us.season_id = ${seasonId}
      AND COALESCE(us.status, 'active') = 'active'
    GROUP BY u.id, us.name, us.icon, us.color_index
    ORDER BY team_value DESC
  `);

  return result.rows;
}

export async function getWinCounts() {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    WITH RoundWinners AS (
      SELECT 
        user_id,
        round_id,
        RANK() OVER (PARTITION BY round_id ORDER BY points DESC) as position
      FROM ${userRounds}
      WHERE season_id = ${seasonId}
        AND participated = TRUE
    )
    SELECT 
      u.id as user_id,
      COALESCE(us.name, u.name) as name,
      COALESCE(us.icon, u.icon) as icon,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      COUNT(rw.round_id)::int as wins
    FROM ${userSeasons} us
    JOIN ${users} u ON u.id = us.user_id
    LEFT JOIN RoundWinners rw ON u.id = rw.user_id AND rw.position = 1
    WHERE us.season_id = ${seasonId}
      AND COALESCE(us.status, 'active') = 'active'
    GROUP BY u.id, us.name, us.icon, us.color_index
    ORDER BY wins DESC
  `);

  return result.rows;
}

export async function getSimpleStandings() {
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    WITH UserTotals AS (
      SELECT 
        user_id,
        SUM(points) as total_points
      FROM ${userRounds}
      WHERE season_id = ${seasonId}
        AND participated = TRUE
      GROUP BY user_id
    )
    SELECT 
      u.id as user_id,
      COALESCE(us.name, u.name) as name,
      COALESCE(us.icon, u.icon) as icon,
      COALESCE(us.color_index, u.color_index, 0) as color_index,
      COALESCE(ut.total_points, 0)::int as total_points,
      COALESCE(sq.team_value, 0)::bigint as team_value,
      COALESCE(sq.price_trend, 0)::int as price_trend,
      RANK() OVER (ORDER BY COALESCE(ut.total_points, 0) DESC)::int as position
    FROM ${userSeasons} us
    JOIN ${users} u ON u.id = us.user_id
    LEFT JOIN UserTotals ut ON u.id = ut.user_id
    LEFT JOIN (
      SELECT 
        owner_id, 
        SUM(price) as team_value,
        SUM(price_increment) as price_trend
      FROM ${playerSeasons}
      WHERE season_id = ${seasonId} AND owner_id IS NOT NULL
      GROUP BY owner_id
    ) sq ON u.id = sq.owner_id
    WHERE us.season_id = ${seasonId}
      AND COALESCE(us.status, 'active') = 'active'
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
  const seasonId = await resolveReadSeasonId();
  const result = await db.execute(sql`
    SELECT ROUND(AVG(points), 1)::float as avg_points
    FROM ${userRounds}
    WHERE season_id = ${seasonId}
      AND participated = TRUE
  `);

  return result.rows[0] ? result.rows[0].avg_points : 0;
}
