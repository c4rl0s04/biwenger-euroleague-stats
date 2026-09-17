import * as dotenv from 'dotenv';
import pg from 'pg';

import { buildPoolConfig } from '../../src/lib/db/connection-config.js';
import { DIVIDER, formatMetrics } from '../../src/lib/sync/reporter.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

function createPool() {
  return new pg.Pool(buildPoolConfig(process.env));
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

    console.log('Sync Preflight');
    console.log(DIVIDER);
    console.log(`Season              ${season.ID} (${writable.status})`);
    console.log(`Biwenger league     ${writable.sourceLeagueId}`);
    console.log(`EuroLeague code     ${season.EUROLEAGUE_CODE}`);
    console.log(`League start        ${season.START_DATE}`);

    console.log('\nExisting season rows:');
    for (const line of formatMetrics(counts.rows[0])) {
      console.log(line);
    }

    if (skipProviderProbes) {
      console.log('\nProvider probes     skipped');
      console.log('Configuration and database binding are valid.');
      return;
    }

    const { biwengerFetch, fetchCompetition, fetchLeague, fetchRoundGames } =
      await import('../../src/lib/api/biwenger-client.js');
    const { getEuroleagueClient } = await import('../../src/lib/api/euroleague/runtime.js');
    const { euroleagueSeasonYear } = await import('../../src/lib/api/euroleague/normalization.js');
    const {
      validateProviderSnapshot,
      validateAdvancedProviderSnapshot,
      validateBiwengerRoundSeason,
    } = await import('../../src/lib/sync/preflight.js');
    const { parseBiwengerCompetition } = await import('../../src/lib/sync/context.js');
    const { relevantRounds } = await import('../../src/lib/sync/rounds.js');

    const account = await biwengerFetch('/account', { skipVersionCheck: true });
    const league = await fetchLeague();
    const competition = await fetchCompetition();
    const seasonYear = euroleagueSeasonYear(season.EUROLEAGUE_CODE, season.ID);
    const provider = getEuroleagueClient();
    const [schedule, standings] = await Promise.all([
      provider.getSchedule(seasonYear),
      provider.getStandings(seasonYear, 1),
    ]);
    const competitionSnapshot = parseBiwengerCompetition(competition);
    const firstRound = relevantRounds(competitionSnapshot.rounds)[0];
    if (!firstRound) throw new Error('Biwenger competition contains no syncable rounds.');
    const firstRoundResponse = await fetchRoundGames(firstRound.id);
    const firstRoundGames = firstRoundResponse?.data?.games || firstRoundResponse?.games || [];
    const biwengerReadiness = validateBiwengerRoundSeason({
      seasonId: season.ID,
      games: firstRoundGames,
    });

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

    console.log(`\nBiwenger account probe: ${accountId}`);

    console.log('\nProvider snapshot:');
    for (const line of formatMetrics(providerCounts)) {
      console.log(line);
    }

    console.log('\nBiwenger season readiness:');
    for (const line of formatMetrics(biwengerReadiness)) {
      console.log(line);
    }

    console.log('\nOfficial snapshot:');
    for (const line of formatMetrics(officialCounts)) {
      console.log(line);
    }

    console.log('\nMapping coverage:');
    for (const line of formatMetrics(mappingCoverage.rows[0])) {
      console.log(line);
    }

    console.log('\n✓ Sync preflight passed. No database rows were modified.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('\n✗ Sync preflight failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
