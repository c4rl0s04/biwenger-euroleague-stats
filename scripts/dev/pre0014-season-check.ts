import 'dotenv/config';
import type pg from 'pg';
import {
  ALL_14_DROPPED_PLAYER_COLUMNS,
  ALL_4_DROPPED_TEAM_COLUMNS,
} from '../season-model/backfill-2025-26';

export interface Pre0014CheckResult {
  safe: boolean;
  alreadyMigrated: boolean;
  seasonId: string;
  unmigratedPlayers: number;
  unmigratedTeams: number;
  playerMismatches: number;
  teamMismatches: number;
  dataMismatches: number;
  errors: string[];
}

export async function checkPre0014Safety(
  client: pg.ClientBase | pg.Pool,
  seasonId: string = '2025-26'
): Promise<Pre0014CheckResult> {
  const errors: string[] = [];

  // 1. Check if deprecated columns still exist on source tables
  const playerCols = await client.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'players' 
       AND column_name = ANY($1::text[])`,
    [ALL_14_DROPPED_PLAYER_COLUMNS as readonly string[]]
  );

  const teamCols = await client.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'teams' 
       AND column_name = ANY($1::text[])`,
    [ALL_4_DROPPED_TEAM_COLUMNS as readonly string[]]
  );

  // If none of the 18 columns exist, migration 0014 was already applied
  if (playerCols.rows.length === 0 && teamCols.rows.length === 0) {
    return {
      safe: true,
      alreadyMigrated: true,
      seasonId,
      unmigratedPlayers: 0,
      unmigratedTeams: 0,
      playerMismatches: 0,
      teamMismatches: 0,
      dataMismatches: 0,
      errors: [],
    };
  }

  // 2. Ensure target season exists
  const seasonRes = await client.query('SELECT id FROM seasons WHERE id = $1', [seasonId]);
  if (seasonRes.rows.length === 0) {
    errors.push(`Target season "${seasonId}" does not exist in seasons table.`);
    return {
      safe: false,
      alreadyMigrated: false,
      seasonId,
      unmigratedPlayers: 0,
      unmigratedTeams: 0,
      playerMismatches: 0,
      teamMismatches: 0,
      dataMismatches: 0,
      errors,
    };
  }

  // 3. Check for unmigrated players
  const unmigratedPlayersRes = await client.query(
    `SELECT count(*)::int AS count
     FROM players p
     LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $1
     WHERE ps.player_id IS NULL`,
    [seasonId]
  );
  const unmigratedPlayers = unmigratedPlayersRes.rows[0]?.count ?? 0;
  if (unmigratedPlayers > 0) {
    errors.push(
      `Found ${unmigratedPlayers} unmigrated players without corresponding player_seasons for season "${seasonId}".`
    );
  }

  // 4. Check for unmigrated teams
  const unmigratedTeamsRes = await client.query(
    `SELECT count(*)::int AS count
     FROM teams t
     LEFT JOIN team_seasons ts ON ts.team_id = t.id AND ts.season_id = $1
     WHERE ts.team_id IS NULL`,
    [seasonId]
  );
  const unmigratedTeams = unmigratedTeamsRes.rows[0]?.count ?? 0;
  if (unmigratedTeams > 0) {
    errors.push(
      `Found ${unmigratedTeams} unmigrated teams without corresponding team_seasons for season "${seasonId}".`
    );
  }

  // 5. Check for data mismatches across ALL 14 player columns
  const playerMismatchPredicates = ALL_14_DROPPED_PLAYER_COLUMNS.map(
    (col) => `ps.${col} IS DISTINCT FROM p.${col}`
  ).join('\n        OR ');

  const playerMismatchRes = await client.query(
    `SELECT count(*)::int AS count
     FROM players p
     JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $1
     WHERE ${playerMismatchPredicates}`,
    [seasonId]
  );
  const playerMismatches = playerMismatchRes.rows[0]?.count ?? 0;
  if (playerMismatches > 0) {
    errors.push(
      `Found ${playerMismatches} player records with value mismatches across the 14 migrated columns between players and player_seasons for season "${seasonId}".`
    );
  }

  // 6. Check for data mismatches across ALL 4 team columns
  const teamMismatchPredicates = ALL_4_DROPPED_TEAM_COLUMNS.map(
    (col) => `ts.${col} IS DISTINCT FROM t.${col}`
  ).join('\n        OR ');

  const teamMismatchRes = await client.query(
    `SELECT count(*)::int AS count
     FROM teams t
     JOIN team_seasons ts ON ts.team_id = t.id AND ts.season_id = $1
     WHERE ${teamMismatchPredicates}`,
    [seasonId]
  );
  const teamMismatches = teamMismatchRes.rows[0]?.count ?? 0;
  if (teamMismatches > 0) {
    errors.push(
      `Found ${teamMismatches} team records with value mismatches across the 4 migrated columns between teams and team_seasons for season "${seasonId}".`
    );
  }

  const dataMismatches = playerMismatches + teamMismatches;

  return {
    safe: errors.length === 0,
    alreadyMigrated: false,
    seasonId,
    unmigratedPlayers,
    unmigratedTeams,
    playerMismatches,
    teamMismatches,
    dataMismatches,
    errors,
  };
}

async function main() {
  const { default: pg } = await import('pg');
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is required to run pre-0014 check.');
    process.exit(1);
  }

  const seasonArg = process.argv.find((arg) => arg.startsWith('--season='));
  const seasonId = seasonArg ? seasonArg.split('=')[1] : '2025-26';

  console.log(`🔍 Checking pre-0014 migration safety for season "${seasonId}"...`);
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const result = await checkPre0014Safety(client, seasonId);
    if (result.alreadyMigrated) {
      console.log('✅ Migration 0014 has already been applied. Dropped columns are absent.');
      process.exit(0);
    }

    if (result.safe) {
      console.log(
        `✅ Safe to apply migration 0014: all 18 columns for players and teams match exactly for season "${seasonId}".`
      );
      process.exit(0);
    }

    console.error('❌ Pre-0014 safety check FAILED:');
    for (const error of result.errors) {
      console.error(`   - ${error}`);
    }
    console.error(
      `\n👉 Action required: Run the canonical backfill script before applying migration 0014:\n   npm run db:season:backfill-2025`
    );
    process.exit(1);
  } catch (error) {
    console.error('❌ Pre-0014 safety check encountered unexpected error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('pre0014-season-check.ts')) {
  void main();
}
