import 'dotenv/config';
import pg from 'pg';

const ALL_14_DROPPED_PLAYER_COLUMNS = [
  'position',
  'puntos',
  'partidos_jugados',
  'played_home',
  'played_away',
  'points_home',
  'points_away',
  'points_last_season',
  'owner_id',
  'status',
  'price_increment',
  'price',
  'dorsal',
  'team_id',
];

const ALL_4_DROPPED_TEAM_COLUMNS = ['city', 'arena_name', 'latitude', 'longitude'];

export interface Pre0014CheckResult {
  safe: boolean;
  alreadyMigrated: boolean;
  unmigratedPlayers: number;
  unmigratedTeams: number;
  dataMismatches: number;
  errors: string[];
}

export async function checkPre0014Safety(
  client: pg.ClientBase | pg.Pool
): Promise<Pre0014CheckResult> {
  const errors: string[] = [];

  // 1. Check if deprecated columns still exist on source tables
  const playerCols = await client.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'players' 
       AND column_name = ANY($1::text[])`,
    [ALL_14_DROPPED_PLAYER_COLUMNS]
  );

  const teamCols = await client.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'teams' 
       AND column_name = ANY($1::text[])`,
    [ALL_4_DROPPED_TEAM_COLUMNS]
  );

  // If none of the 18 columns exist, migration 0014 was already applied
  if (playerCols.rows.length === 0 && teamCols.rows.length === 0) {
    return {
      safe: true,
      alreadyMigrated: true,
      unmigratedPlayers: 0,
      unmigratedTeams: 0,
      dataMismatches: 0,
      errors: [],
    };
  }

  // 2. Resolve active season
  const seasonRes = await client.query(
    `SELECT id FROM seasons WHERE status = 'active' ORDER BY id DESC LIMIT 1`
  );
  const activeSeasonId = seasonRes.rows[0]?.id || '2025-26';

  // 3. Check for unmigrated players
  const unmigratedPlayersRes = await client.query(
    `SELECT count(*)::int AS count
     FROM players p
     LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $1
     WHERE ps.player_id IS NULL`,
    [activeSeasonId]
  );
  const unmigratedPlayers = unmigratedPlayersRes.rows[0]?.count ?? 0;
  if (unmigratedPlayers > 0) {
    errors.push(
      `Found ${unmigratedPlayers} unmigrated players without corresponding player_seasons for season "${activeSeasonId}".`
    );
  }

  // 4. Check for unmigrated teams
  const unmigratedTeamsRes = await client.query(
    `SELECT count(*)::int AS count
     FROM teams t
     LEFT JOIN team_seasons ts ON ts.team_id = t.id AND ts.season_id = $1
     WHERE ts.team_id IS NULL`,
    [activeSeasonId]
  );
  const unmigratedTeams = unmigratedTeamsRes.rows[0]?.count ?? 0;
  if (unmigratedTeams > 0) {
    errors.push(
      `Found ${unmigratedTeams} unmigrated teams without corresponding team_seasons for season "${activeSeasonId}".`
    );
  }

  // 5. Check for data mismatches between source and destination
  const mismatchRes = await client.query(
    `SELECT count(*)::int AS count
     FROM players p
     JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $1
     WHERE ps.puntos IS DISTINCT FROM p.puntos
        OR ps.team_id IS DISTINCT FROM p.team_id
        OR ps.position IS DISTINCT FROM p.position`,
    [activeSeasonId]
  );
  const dataMismatches = mismatchRes.rows[0]?.count ?? 0;
  if (dataMismatches > 0) {
    errors.push(
      `Found ${dataMismatches} player records with value mismatches between players and player_seasons.`
    );
  }

  return {
    safe: errors.length === 0,
    alreadyMigrated: false,
    unmigratedPlayers,
    unmigratedTeams,
    dataMismatches,
    errors,
  };
}

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is required to run pre-0014 check.');
    process.exit(1);
  }

  console.log('🔍 Checking pre-0014 migration safety...');
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const result = await checkPre0014Safety(client);
    if (result.alreadyMigrated) {
      console.log('✅ Migration 0014 has already been applied. Dropped columns are absent.');
      process.exit(0);
    }

    if (result.safe) {
      console.log(
        '✅ Safe to apply migration 0014: all players and teams are fully backfilled in seasonal tables.'
      );
      process.exit(0);
    }

    console.error('❌ Pre-0014 safety check FAILED:');
    for (const error of result.errors) {
      console.error(`   - ${error}`);
    }
    console.error(
      '\n👉 Action required: Run the canonical backfill script before applying migration 0014:\n   npm run db:season:backfill-2025'
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
