import 'server-only';
import { db as pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';

type NumericField = string | number | null;
export interface CaptainOverallRow {
  total_rounds: NumericField;
  extra_points: NumericField;
  avg_points: NumericField;
}
export interface CaptainUsageRow {
  player_id: number;
  name: string | null;
  times_captain: NumericField;
  avg_as_captain: NumericField;
  total_as_captain: NumericField;
}
export interface CaptainRoundRow {
  name: string | null;
  points: NumericField;
}
export interface CaptainReadRows {
  overall: CaptainOverallRow | undefined;
  mostUsed: CaptainUsageRow[];
  best: CaptainRoundRow | undefined;
  worst: CaptainRoundRow | undefined;
}
export interface HomeAwayRow {
  total_home: NumericField;
  total_away: NumericField;
  games_home: NumericField;
  games_away: NumericField;
}

export async function readManagerCaptainStats(userId: string | number): Promise<CaptainReadRows> {
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
  // Keep the original sequence and bind order; no parallelization or cache changes.
  const overall = (await pgClient.query<CaptainOverallRow>(overallQuery, [userId, seasonId]))
    .rows[0];
  const mostUsed = (await pgClient.query<CaptainUsageRow>(mostUsedQuery, [userId, seasonId])).rows;
  const best = (await pgClient.query<CaptainRoundRow>(bestQuery, [userId, seasonId])).rows[0];
  const worst = (await pgClient.query<CaptainRoundRow>(worstQuery, [userId, seasonId])).rows[0];
  return { overall, mostUsed, best, worst };
}

export async function readManagerHomeAway(
  userId: string | number
): Promise<HomeAwayRow | undefined> {
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
  return (await pgClient.query<HomeAwayRow>(query, [seasonId, userId])).rows[0];
}
