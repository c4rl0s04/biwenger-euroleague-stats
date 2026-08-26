import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

function createPool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionString) {
    const local = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    return new pg.Pool({
      connectionString,
      ssl: local ? false : { rejectUnauthorized: false },
    });
  }

  return new pg.Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
    database: process.env.POSTGRES_DB,
  });
}

async function main() {
  const skipProviderProbes = process.argv.includes('--skip-provider-probes');
  const { validateSeasonConfig } = await import('../../src/lib/config.js');
  const { assertSyncSeasonWritable } = await import('../../src/lib/sync/season-guard.js');
  const season = validateSeasonConfig();
  const pool = createPool();

  try {
    const writable = await assertSyncSeasonWritable(pool);
    const counts = await pool.query<{
      players: string;
      users: string;
      market_values: string;
      ownerships: string;
    }>(
      `
      SELECT
        (SELECT COUNT(*) FROM player_seasons WHERE season_id = $1)::text AS players,
        (SELECT COUNT(*) FROM user_seasons WHERE season_id = $1)::text AS users,
        (SELECT COUNT(*) FROM market_values WHERE season_id = $1)::text AS market_values,
        (SELECT COUNT(*) FROM player_seasons WHERE season_id = $1 AND owner_id IS NOT NULL)::text AS ownerships
    `,
      [season.ID]
    );

    console.log(`Season: ${season.ID} (${writable.status})`);
    console.log(`Biwenger league: ${writable.sourceLeagueId}`);
    console.log(`EuroLeague code: ${season.EUROLEAGUE_CODE}`);
    console.log(`League start: ${season.START_DATE}`);
    console.log(`Existing season rows: ${JSON.stringify(counts.rows[0])}`);

    if (skipProviderProbes) {
      console.log('Provider probes skipped; configuration and database binding are valid.');
      return;
    }

    const { biwengerFetch, fetchCompetition, fetchLeague } =
      await import('../../src/lib/api/biwenger-client.js');
    const { getOfficialBasketballProvider } =
      await import('../../src/lib/api/official-provider-factory.js');
    const { officialSeasonYear } = await import('../../src/lib/api/official-provider.js');
    const { validateProviderSnapshot, validateAdvancedProviderSnapshot } =
      await import('../../src/lib/sync/preflight.js');

    const account = await biwengerFetch('/account', { skipVersionCheck: true });
    const league = await fetchLeague();
    const competition = await fetchCompetition();
    const seasonYear = officialSeasonYear(season.EUROLEAGUE_CODE, season.ID);
    const provider = await getOfficialBasketballProvider();
    const [schedule, standings] = await Promise.all([
      provider.getSchedule(seasonYear),
      provider.getStandings(seasonYear, 1),
    ]);

    const providerCounts = validateProviderSnapshot({
      seasonId: season.ID,
      biwengerLeagueId: season.BIWENGER_LEAGUE_ID,
      biwengerUserId: season.BIWENGER_USER_ID,
      euroleagueCode: season.EUROLEAGUE_CODE,
      league,
      competition,
      schedule,
    });
    const officialCounts = validateAdvancedProviderSnapshot({
      seasonYear,
      expectedSeasonId: season.ID,
      schedule,
      standings,
    });
    const mappingCoverage = await pool.query<{
      official_teams: string;
      mapped_teams: string;
      pending_players: string;
    }>(
      `SELECT
         (SELECT COUNT(DISTINCT code) FROM unnest($2::text[]) AS code)::text AS official_teams,
         (SELECT COUNT(*) FROM official_team_mappings
          WHERE season_id=$1 AND provider='euroleague_advanced')::text AS mapped_teams,
         (SELECT COUNT(*) FROM official_player_mappings
          WHERE season_id=$1 AND status='review_required')::text AS pending_players`,
      [season.ID, [...new Set(schedule.flatMap((game) => [game.homeTeamCode, game.awayTeamCode]))]]
    );
    const accountId = account?.data?.id ?? account?.id ?? 'available';

    console.log(`Biwenger account probe: ${accountId}`);
    console.log(`Provider snapshot: ${JSON.stringify(providerCounts)}`);
    console.log(`Official snapshot: ${JSON.stringify(officialCounts)}`);
    console.log(`Mapping coverage: ${JSON.stringify(mappingCoverage.rows[0])}`);

    console.log('Sync preflight passed. No database rows were modified.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Sync preflight failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
