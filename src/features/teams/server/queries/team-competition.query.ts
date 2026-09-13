import 'server-only';
import { db as pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type {
  TeamMatchCountRecord,
  TeamStandingRecord,
  TeamFormRecord,
  TeamOpponentRecord,
  TeamCompetitionFacts,
} from './team-competition.records';

export async function readTeamMatchCount(
  numericTeamId: number
): Promise<string | number | undefined> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT COUNT(DISTINCT m.id) as count
    FROM matches m
    WHERE m.season_id = $2
      AND (m.home_id = $1 OR m.away_id = $1)
      AND m.date < NOW()
      AND m.round_id IN (SELECT DISTINCT round_id FROM player_round_stats WHERE season_id = $2)
  `;
  const res = await pgClient.query(query, [numericTeamId, seasonId]);
  return res.rows[0]?.count as string | number | undefined;
}
export async function readAllTeamMatchCounts(): Promise<TeamMatchCountRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT 
      t.id as team_id,
      COUNT(DISTINCT m.id) as count
    FROM teams t
    JOIN matches m ON (m.home_id = t.id OR m.away_id = t.id)
    WHERE m.season_id = $1
      AND m.date < NOW()
      AND m.round_id IN (SELECT DISTINCT round_id FROM player_round_stats WHERE season_id = $1)
    GROUP BY t.id
  `;
  return (await pgClient.query(query, [seasonId])).rows as TeamMatchCountRecord[];
}
export async function readTeamCompetitionFacts(): Promise<TeamCompetitionFacts> {
  const seasonId = await resolveReadSeasonId();
  const standingsQuery = `
    WITH TeamStandings AS (
      SELECT 
        team_id,
        SUM(wins) as wins,
        SUM(losses) as losses,
        SUM(points_scored) - SUM(points_conceded) as point_diff
      FROM (
        SELECT 
          home_id as team_id,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) > away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as wins,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) < away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as losses,
          home_score_regtime + COALESCE(home_ot, 0) as points_scored,
          away_score_regtime + COALESCE(away_ot, 0) as points_conceded
        FROM matches WHERE season_id = $1 AND status = 'finished'
        UNION ALL
        SELECT 
          away_id as team_id,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) > home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as wins,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) < home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as losses,
          away_score_regtime + COALESCE(away_ot, 0) as points_scored,
          home_score_regtime + COALESCE(home_ot, 0) as points_conceded
        FROM matches WHERE season_id = $1 AND status = 'finished'
      ) all_matches
      GROUP BY team_id
    ),
    RankedStandings AS (
      SELECT 
        team_id,
        wins,
        RANK() OVER (ORDER BY wins DESC, point_diff DESC) as position
      FROM TeamStandings
    )
    SELECT * FROM RankedStandings
  `;
  const standings = (await pgClient.query(standingsQuery, [seasonId])).rows as TeamStandingRecord[];
  const formQuery = `
    SELECT 
      team_id,
      SUM(win) as recent_wins,
      COUNT(*) as recent_matches
    FROM (
      SELECT 
        m.home_id as team_id,
        CASE WHEN (m.home_score_regtime + COALESCE(m.home_ot, 0) > m.away_score_regtime + COALESCE(m.away_ot, 0)) THEN 1 ELSE 0 END as win,
        ROW_NUMBER() OVER(PARTITION BY m.home_id ORDER BY m.date DESC) as rn
      FROM matches m WHERE m.season_id = $1 AND m.status = 'finished'
      UNION ALL
      SELECT 
        m.away_id as team_id,
        CASE WHEN (m.away_score_regtime + COALESCE(m.away_ot, 0) > m.home_score_regtime + COALESCE(m.home_ot, 0)) THEN 1 ELSE 0 END as win,
        ROW_NUMBER() OVER(PARTITION BY m.away_id ORDER BY m.date DESC) as rn
      FROM matches m WHERE m.season_id = $1 AND m.status = 'finished'
    ) recent
    WHERE rn <= 5
    GROUP BY team_id
  `;
  const form = (await pgClient.query(formQuery, [seasonId])).rows as TeamFormRecord[];
  const nextMatchesQuery = `
    SELECT 
      team_id,
      opponent_id
    FROM (
      SELECT 
        m.home_id as team_id,
        m.away_id as opponent_id,
        ROW_NUMBER() OVER(PARTITION BY m.home_id ORDER BY m.date ASC) as rn
      FROM matches m WHERE m.season_id = $1 AND m.date > NOW()
      UNION ALL
      SELECT 
        m.away_id as team_id,
        m.home_id as opponent_id,
        ROW_NUMBER() OVER(PARTITION BY m.away_id ORDER BY m.date ASC) as rn
      FROM matches m WHERE m.season_id = $1 AND m.date > NOW()
    ) next_matches
    WHERE rn <= 3
  `;
  const opponents = (await pgClient.query(nextMatchesQuery, [seasonId]))
    .rows as TeamOpponentRecord[];
  return { standings, form, opponents };
}
