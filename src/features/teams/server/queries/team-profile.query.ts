import 'server-only';

import { db as pgClient } from '@/lib/db/client';
import { getPlayerFormMap } from '@/lib/db/queries/core/playerForm';
import { getTeamMatchesCount, getTeamPlayoffProbability } from '@/lib/db/queries/core/teams';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export interface TeamProfileDetailsRow {
  id: number | string;
  name: string | null;
  short_name: string | null;
  logo: string | null;
  total_fantasy_points: number | string | null;
  total_real_points: number | string | null;
  avg_pir: number | string | null;
  total_value: number | string | null;
  roster_size: number | string | null;
  wins: number | string | null;
  losses: number | string | null;
}

export interface TeamProfileDetailsQueryResult {
  row: TeamProfileDetailsRow;
  matchesPlayed: number;
  playoffProbability: number;
  rank: number | string | null;
}

export interface TeamRosterRow {
  id: number | string;
  name: string | null;
  img: string | null;
  position: string | null;
  price: number | string | null;
  price_increment: number | string | null;
  points: number | string | null;
  average: number | string | null;
  owner_id: number | string | null;
  owner_name: string | null;
  owner_color_index: number | string | null;
  owner_icon: string | null;
  recent_scores: string | null;
}

async function listRegularSeasonStandings(seasonId: string) {
  const query = `
    WITH TeamStats AS (
      SELECT
        team_id,
        SUM(win) as wins,
        SUM(loss) as losses,
        SUM(points_for) as points_for,
        SUM(points_against) as points_against
      FROM (
        SELECT
          home_id as team_id,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) > away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as win,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) < away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as loss,
          home_score_regtime + COALESCE(home_ot, 0) as points_for,
          away_score_regtime + COALESCE(away_ot, 0) as points_against
        FROM matches WHERE season_id = $1 AND status = 'finished' AND round_name LIKE 'Jornada %'
        UNION ALL
        SELECT
          away_id as team_id,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) > home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as win,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) < home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as loss,
          away_score_regtime + COALESCE(away_ot, 0) as points_for,
          home_score_regtime + COALESCE(home_ot, 0) as points_against
        FROM matches WHERE season_id = $1 AND status = 'finished' AND round_name LIKE 'Jornada %'
      ) all_matches
      GROUP BY team_id
    )
    SELECT
      team_id,
      wins,
      losses,
      RANK() OVER (ORDER BY wins DESC, (points_for - points_against) DESC) as rank
    FROM TeamStats
  `;
  return (await pgClient.query(query, [seasonId])).rows as Array<{
    team_id: number | string;
    rank: number | string | null;
  }>;
}

export async function findTeamProfileDetails(
  teamId: number
): Promise<TeamProfileDetailsQueryResult | null> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH TeamMatchStats AS (
      SELECT
        team_id,
        SUM(win) as wins,
        SUM(loss) as losses
      FROM (
        SELECT
          home_id as team_id,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) > away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as win,
          CASE WHEN home_score_regtime + COALESCE(home_ot, 0) < away_score_regtime + COALESCE(away_ot, 0) THEN 1 ELSE 0 END as loss
        FROM matches WHERE season_id = $2 AND status = 'finished' AND home_id = $1 AND round_name LIKE 'Jornada %'
        UNION ALL
        SELECT
          away_id as team_id,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) > home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as win,
          CASE WHEN away_score_regtime + COALESCE(away_ot, 0) < home_score_regtime + COALESCE(home_ot, 0) THEN 1 ELSE 0 END as loss
        FROM matches WHERE season_id = $2 AND status = 'finished' AND away_id = $1 AND round_name LIKE 'Jornada %'
      ) all_matches
      GROUP BY team_id
    )
    SELECT
      t.id,
      t.name,
      t.short_name,
      COALESCE(otm.crest_url, t.img) as logo,
      COALESCE(SUM(prs.fantasy_points), 0) as total_fantasy_points,
      COALESCE(SUM(prs.points), 0) as total_real_points,
      COALESCE(ROUND(AVG(prs.valuation), 1), 0) as avg_pir,
      COALESCE(SUM(COALESCE(ps.price, p.price)), 0) as total_value,
      (SELECT COUNT(*) FROM player_seasons WHERE season_id = $2 AND team_id = t.id) as roster_size,
      COALESCE(tms.wins, 0) as wins,
      COALESCE(tms.losses, 0) as losses
    FROM teams t
    LEFT JOIN player_seasons ps ON ps.season_id = $2 AND ps.team_id = t.id
    LEFT JOIN players p ON p.id = ps.player_id
    LEFT JOIN player_round_stats prs ON p.id = prs.player_id AND prs.season_id = $2
    LEFT JOIN TeamMatchStats tms ON t.id = tms.team_id
    LEFT JOIN official_team_mappings otm
      ON otm.team_id=t.id AND otm.season_id=$2 AND otm.provider='euroleague_advanced'
    WHERE t.id = $1
    GROUP BY t.id, t.name, t.short_name, t.img, otm.crest_url, tms.wins, tms.losses
  `;

  const [detailsResult, matchesPlayed, playoffProbability, standings] = await Promise.all([
    pgClient.query(query, [teamId, seasonId]),
    getTeamMatchesCount(teamId),
    getTeamPlayoffProbability(teamId),
    listRegularSeasonStandings(seasonId),
  ]);
  const row = detailsResult.rows[0] as TeamProfileDetailsRow | undefined;
  if (!row) return null;

  return {
    row,
    matchesPlayed,
    playoffProbability,
    rank:
      standings.find((entry: { team_id: number | string }) => Number(entry.team_id) === teamId)
        ?.rank ?? 0,
  };
}

export async function listTeamRoster(teamId: number): Promise<TeamRosterRow[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      p.id, p.name, COALESCE(opm.image_url,p.img) AS img, p.position,
      COALESCE(ps.price, p.price) as price,
      COALESCE(ps.price_increment, p.price_increment) as price_increment,
      COALESCE(ps.puntos, p.puntos) as points,
      ROUND(CAST(COALESCE(ps.puntos, p.puntos) AS NUMERIC) / NULLIF(COALESCE(ps.partidos_jugados, p.partidos_jugados), 0), 1) as average,
      ps.owner_id,
      COALESCE(us.name, u.name) as owner_name,
      COALESCE(us.color_index, u.color_index, 0) as owner_color_index,
      COALESCE(us.icon, u.icon) as owner_icon
    FROM players p
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $2
    LEFT JOIN official_player_mappings opm
      ON opm.player_id=p.id AND opm.season_id=ps.season_id
     AND opm.provider='euroleague_advanced' AND opm.status='matched'
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ps.season_id
    WHERE COALESCE(ps.team_id, p.team_id) = $1
    ORDER BY COALESCE(ps.puntos, p.puntos) DESC
  `;

  const [rows, formMap] = await Promise.all([
    pgClient
      .query(query, [teamId, seasonId])
      .then((result: { rows: unknown[] }) => result.rows as TeamRosterRow[]),
    getPlayerFormMap(),
  ]);

  return rows.map((row: TeamRosterRow) => ({
    ...row,
    recent_scores: formMap.get(Number(row.id))?.recent_scores ?? null,
  }));
}
