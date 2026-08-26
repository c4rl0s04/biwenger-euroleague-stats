import * as dotenv from 'dotenv';
import { db } from '../../src/lib/db/client';
import { normalizeEuroleaguePlayerCode } from '../../src/lib/api/euroleague/normalization';
import { assertSyncSeasonWritable } from '../../src/lib/sync/season-guard';

dotenv.config({ path: '.env.local' });
dotenv.config();

function argument(name: string) {
  return process.argv
    .find((value) => value.startsWith(`--${name}=`))
    ?.split('=')
    .slice(1)
    .join('=');
}

async function report(seasonId: string) {
  const teams = await db.query(
    `SELECT provider_team_code,provider_name,team_id,match_method,confidence
     FROM official_team_mappings WHERE season_id=$1 ORDER BY provider_name`,
    [seasonId]
  );
  const players = await db.query(
    `SELECT provider_player_code,provider_name,provider_team_code,player_id,status,
            match_method,confidence
     FROM official_player_mappings WHERE season_id=$1
     ORDER BY status DESC,provider_team_code,provider_name`,
    [seasonId]
  );
  const unmappedTeams = await db.query(
    `WITH official_codes AS (
       SELECT DISTINCT home_team_code AS code FROM official_games WHERE season_id=$1
       UNION
       SELECT DISTINCT away_team_code AS code FROM official_games WHERE season_id=$1
     )
     SELECT code FROM official_codes c
     WHERE NOT EXISTS (
       SELECT 1 FROM official_team_mappings m
       WHERE m.season_id=$1 AND m.provider_team_code=c.code
     ) ORDER BY code`,
    [seasonId]
  );
  console.log(
    JSON.stringify(
      { seasonId, teams: teams.rows, unmappedTeams: unmappedTeams.rows, players: players.rows },
      null,
      2
    )
  );
}

async function main() {
  const season = await assertSyncSeasonWritable(db as any);
  const command = process.argv[2] || 'report';
  if (command === 'report') return report(season.seasonId);

  if (command === 'assign-team') {
    const code = argument('code')?.trim().toUpperCase();
    const teamId = Number(argument('team-id'));
    if (!code || !Number.isInteger(teamId)) {
      throw new Error('Usage: assign-team --code=XXX --team-id=123');
    }
    const result = await db.query(
      `INSERT INTO official_team_mappings (
         season_id,team_id,provider,provider_team_code,provider_name,match_method,confidence,updated_at
       )
       SELECT $1,$3,'euroleague_advanced',$2,
              COALESCE(
                (SELECT raw_schedule->>'hometeam' FROM official_games
                 WHERE season_id=$1 AND home_team_code=$2 LIMIT 1),
                (SELECT raw_schedule->>'awayteam' FROM official_games
                 WHERE season_id=$1 AND away_team_code=$2 LIMIT 1),
                $2
              ),
              'manual',1,NOW()
       WHERE EXISTS (
         SELECT 1 FROM official_games
         WHERE season_id=$1 AND (home_team_code=$2 OR away_team_code=$2)
       )
       ON CONFLICT (season_id,provider,provider_team_code) DO UPDATE SET
         team_id=EXCLUDED.team_id,match_method='manual',confidence=1,updated_at=NOW()
       RETURNING provider_name`,
      [season.seasonId, code, teamId]
    );
    if (result.rowCount !== 1) throw new Error(`Official team ${code} was not found.`);
    console.log(`Assigned ${code} to fantasy team ${teamId} in ${season.seasonId}.`);
    return;
  }

  if (command === 'assign-player') {
    const code = normalizeEuroleaguePlayerCode(argument('code'));
    const playerId = Number(argument('player-id'));
    if (!code || !Number.isInteger(playerId)) {
      throw new Error('Usage: assign-player --code=P000000 --player-id=123');
    }
    const result = await db.query(
      `UPDATE official_player_mappings SET player_id=$3,status='matched',match_method='manual',
              confidence=1,updated_at=NOW()
       WHERE season_id=$1 AND provider_player_code=$2 RETURNING provider_name`,
      [season.seasonId, code, playerId]
    );
    if (result.rowCount !== 1) throw new Error(`Official player ${code} was not found.`);
    await db.query(
      `INSERT INTO player_round_stats (
         season_id,player_id,round_id,minutes,points,two_points_made,two_points_attempted,
         three_points_made,three_points_attempted,free_throws_made,free_throws_attempted,
         rebounds,offensive_rebounds,defensive_rebounds,assists,steals,blocks,blocks_against,
         turnovers,fouls_committed,fouls_received,valuation,plus_minus,games_started
       )
       SELECT s.season_id,$3,m.round_id,ROUND(SUM(s.minutes_seconds)/60.0)::int,SUM(s.points),
         SUM(s.two_points_made),SUM(s.two_points_attempted),SUM(s.three_points_made),
         SUM(s.three_points_attempted),SUM(s.free_throws_made),SUM(s.free_throws_attempted),
         SUM(s.total_rebounds),SUM(s.offensive_rebounds),SUM(s.defensive_rebounds),SUM(s.assists),
         SUM(s.steals),SUM(s.blocks),SUM(s.blocks_against),SUM(s.turnovers),SUM(s.fouls_committed),
         SUM(s.fouls_received),SUM(s.valuation),SUM(s.plus_minus),
         SUM(CASE WHEN s.is_starter THEN 1 ELSE 0 END)
       FROM official_player_game_stats s
       JOIN matches m ON m.season_id=s.season_id AND m.official_game_code=s.game_code
       WHERE s.season_id=$1 AND s.provider_player_code=$2
       GROUP BY s.season_id,m.round_id
       ON CONFLICT (season_id,player_id,round_id) DO UPDATE SET
         minutes=EXCLUDED.minutes,points=EXCLUDED.points,two_points_made=EXCLUDED.two_points_made,
         two_points_attempted=EXCLUDED.two_points_attempted,three_points_made=EXCLUDED.three_points_made,
         three_points_attempted=EXCLUDED.three_points_attempted,free_throws_made=EXCLUDED.free_throws_made,
         free_throws_attempted=EXCLUDED.free_throws_attempted,rebounds=EXCLUDED.rebounds,
         offensive_rebounds=EXCLUDED.offensive_rebounds,defensive_rebounds=EXCLUDED.defensive_rebounds,
         assists=EXCLUDED.assists,steals=EXCLUDED.steals,blocks=EXCLUDED.blocks,
         blocks_against=EXCLUDED.blocks_against,turnovers=EXCLUDED.turnovers,
         fouls_committed=EXCLUDED.fouls_committed,fouls_received=EXCLUDED.fouls_received,
         valuation=EXCLUDED.valuation,plus_minus=EXCLUDED.plus_minus,games_started=EXCLUDED.games_started`,
      [season.seasonId, code, playerId]
    );
    console.log(
      `Assigned ${code} to fantasy player ${playerId} and rematerialized ${season.seasonId}.`
    );
    return;
  }
  throw new Error(`Unknown command ${command}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (typeof db.end === 'function') await db.end();
  });
