import 'server-only';

import type { Pool, PoolClient } from 'pg';
import { pool } from '@/lib/db/client';
import type { OutcomeStatus, PreseasonOutcomes } from '../../models/preseason-scoring';

const database = pool as Pool;
type Connection = Pool | PoolClient;

// Players tied at the maximum of `value` win; NULLs never lead.
const leadersOf = (source: string, value: string) =>
  `SELECT id::text AS id FROM (
     SELECT id, RANK() OVER (ORDER BY ${value} DESC) AS rank FROM (${source}) s WHERE ${value} IS NOT NULL
   ) ranked WHERE rank = 1`;

const PLAYER_ROUND_POINTS = `SELECT player_id AS id, round_id, fantasy_points AS value
  FROM player_round_stats
  WHERE season_id = $1 AND player_id IS NOT NULL AND fantasy_points IS NOT NULL`;

// Mirrors the standings feature: active members, participated rounds only.
const MANAGER_ROUND_POINTS = `SELECT ur.user_id AS id, ur.round_id, ur.points AS value
  FROM user_rounds ur JOIN user_seasons us ON us.season_id = ur.season_id AND us.user_id = ur.user_id
  WHERE ur.season_id = $1 AND COALESCE(us.status, 'active') = 'active'
    AND ur.participated = TRUE AND ur.points IS NOT NULL`;

const roundLeaderCounts = (rounds: string) =>
  `SELECT id, COUNT(*) AS value FROM (
     SELECT id, RANK() OVER (PARTITION BY round_id ORDER BY value DESC) AS rank FROM (${rounds}) r
   ) ranked WHERE rank = 1 GROUP BY id`;

const SINGLE_QUERIES = {
  'player-total-points': leadersOf(
    `SELECT id, SUM(value) AS value FROM (${PLAYER_ROUND_POINTS}) r GROUP BY id`,
    'value'
  ),
  'player-round-leader': leadersOf(roundLeaderCounts(PLAYER_ROUND_POINTS), 'value'),
  'player-best-round': leadersOf(
    `SELECT id, MAX(value) AS value FROM (${PLAYER_ROUND_POINTS}) r GROUP BY id`,
    'value'
  ),
  'manager-round-wins': leadersOf(roundLeaderCounts(MANAGER_ROUND_POINTS), 'value'),
  'manager-best-round': leadersOf(
    `SELECT id, MAX(value) AS value FROM (${MANAGER_ROUND_POINTS}) r GROUP BY id`,
    'value'
  ),
} as const;

// Same total as the standings feature (SUM of participated rounds); members without rounds rank last with 0.
const MANAGER_RANKING = `SELECT us.user_id AS id,
    RANK() OVER (ORDER BY COALESCE(SUM(ur.points), 0) DESC)::int AS position,
    COUNT(ur.user_id)::int AS rounds
  FROM user_seasons us
  LEFT JOIN user_rounds ur ON ur.season_id = us.season_id AND ur.user_id = us.user_id
    AND ur.participated = TRUE
  WHERE us.season_id = $1 AND COALESCE(us.status, 'active') = 'active'
  GROUP BY us.user_id`;

// master-data stores standings only for regular-season gamedays, so the latest round is the final RS table.
const TEAM_RANKING = `SELECT otm.team_id::text AS id, ots.position
  FROM official_team_standings ots
  JOIN official_team_mappings otm ON otm.season_id = ots.season_id
    AND otm.provider = 'euroleague_advanced' AND otm.provider_team_code = ots.team_code
  WHERE ots.season_id = $1 AND ots.position IS NOT NULL
    AND ots.round_number = (SELECT MAX(round_number) FROM official_team_standings WHERE season_id = $1)
  ORDER BY ots.position`;

const RS_COMPLETE = `SELECT COUNT(*) > 0 AND BOOL_AND(is_played) AS complete
  FROM official_schedule_games WHERE season_id = $1 AND phase_code = 'RS'`;

/** Actual preseason results for an explicit season; final once the season is no longer active. */
export async function getPreseasonOutcomes(
  seasonId: string,
  connection: Connection = database
): Promise<PreseasonOutcomes> {
  const query = <Row extends Record<string, unknown>>(text: string) =>
    connection.query<Row>(text, [seasonId]).then((result) => result.rows);

  const [season, rsComplete, managerRanking, teamRanking, ...singles] = await Promise.all([
    query<{ status: string }>('SELECT status FROM seasons WHERE id = $1'),
    query<{ complete: boolean | null }>(RS_COMPLETE),
    query<{ id: string; position: number; rounds: number }>(MANAGER_RANKING),
    query<{ id: string; position: number }>(TEAM_RANKING),
    ...Object.values(SINGLE_QUERIES).map((text) => query<{ id: string }>(text)),
  ]);

  const seasonFinal = season.length > 0 && season[0].status !== 'active';
  const statusFor = (hasData: boolean, final = seasonFinal): OutcomeStatus =>
    !hasData ? 'pending' : final ? 'final' : 'provisional';

  const outcomes: PreseasonOutcomes = {};
  Object.keys(SINGLE_QUERIES).forEach((id, index) => {
    const leaderIds = singles[index].map((row) => row.id);
    outcomes[id] = { kind: 'single', status: statusFor(leaderIds.length > 0), leaderIds };
  });
  outcomes['manager-ranking'] = {
    kind: 'ranking',
    status: statusFor(managerRanking.some((row) => row.rounds > 0)),
    standings: managerRanking.map(({ id, position }) => ({ id, position })),
  };
  outcomes['team-ranking'] = {
    kind: 'ranking',
    status: statusFor(teamRanking.length > 0, seasonFinal || rsComplete[0]?.complete === true),
    standings: teamRanking,
  };
  // Decided by the playoff bracket final (PR5).
  outcomes['team-champion'] = { kind: 'single', status: 'pending', leaderIds: [] };
  return outcomes;
}
