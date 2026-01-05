// Environment variables are loaded by config.js (conditionally)
import { SyncManager } from './manager.js';
import * as syncPlayers from './sync-players.js';
import * as syncEuroleagueMaster from './sync-euroleague-master.js';
import * as syncStandings from './sync-standings.js';
import * as syncSquads from './sync-squads.js';
import * as syncBoard from './sync-board.js';
import * as syncInitialSquads from './sync-initial-squads.js';
import * as syncEuroleagueStats from './sync-euroleague-stats.js';
import * as syncMatches from './sync-matches.js';
import * as syncLineups from './sync-lineups.js';
import * as cleanupRounds from './cleanup-rounds.js';
import {
  buildRoundNameMap,
  normalizeRoundName,
  getCanonicalRoundId,
} from './helpers/normalize-rounds.js';
import { ensureSchema } from '../db/schema.js';
import { CONFIG } from '../config.js';

// Validate environment before starting
if (!process.env.BIWENGER_TOKEN && !CONFIG.API.TOKEN) {
  console.error('❌ ERROR: BIWENGER_TOKEN is required!');
  console.error('   Set it in .env.local or as an environment variable.');
  process.exit(1);
}

const DB_PATH = CONFIG.DB.PATH;

async function syncData() {
  // --- CLI ARGUMENTS PARSING ---
  const args = process.argv.slice(2);
  const flags = {
    noDetails: args.includes('--no-details'), // Skip player details (prices/bio) -> SAVES 300 CALLS
    forceDetails: args.includes('--force-details'), // Force fetch details even if up to date
    onlyMarket: args.includes('--only-market'), // Only sync board/transfers
    activeOnly: args.includes('--active-only'), // Only sync active/future matches
    onlyRound: args.find((a) => a.startsWith('--only-round='))?.split('=')[1], // Sync specific round
    skipEuroleague: args.includes('--skip-euroleague'),
    matchOnly: args.includes('--only-matches'), // Only sync matches (no players/market)
  };

  console.log('🚀 Starting Data Sync (Euroleague + Biwenger)...');
  console.log('   🔧 Config:', JSON.stringify(flags, null, 2));

  // Use SyncManager
  // Correctly pass DB_PATH and flags
  const manager = new SyncManager(DB_PATH, flags);

  try {
    // 0. Initialization & Schema
    manager.addStep('Initialize', async (m) => {
      ensureSchema(m.context.db);
      return { success: true, message: 'Schema ensured.' };
    });

    manager.addStep('Cleanup Rounds', cleanupRounds.run);

    // --- PHASE 1: CORE DATA (Players & Teams) ---
    manager.addStep('Sync Players', async (m) => {
      if (!m.flags.onlyMarket && !m.flags.matchOnly && !m.flags.activeOnly) {
        return syncPlayers.run(m);
      } else if (m.flags.onlyMarket) {
        m.log('   ℹ️ Fetching basic player list for market sync...');
        // Force skipDetails for market-only sync
        m.flags.noDetails = true;
        return syncPlayers.run(m);
      }
      return { success: true, message: 'Skipped Players sync.' };
    });

    manager.addStep('Sync Euroleague Master', async (m) => {
      if (
        !m.flags.onlyMarket &&
        !m.flags.matchOnly &&
        !m.flags.activeOnly &&
        !m.flags.skipEuroleague
      ) {
        return syncEuroleagueMaster.run(m);
      }
      return { success: true, message: 'Skipped Euroleague Master sync.' };
    });

    // --- PHASE 2: USER DATA & MARKET ---
    manager.addStep('Sync Standings', async (m) => {
      if (!m.flags.matchOnly && !m.flags.onlyRound && !m.flags.activeOnly) {
        return syncStandings.run(m);
      }
      return { success: true, message: 'Skipped Standings sync.' };
    });

    manager.addStep('Sync Squads', async (m) => {
      if (!m.flags.matchOnly && !m.flags.onlyRound && !m.flags.activeOnly) {
        return syncSquads.run(m);
      }
      return { success: true, message: 'Skipped Squads sync.' };
    });

    manager.addStep('Sync Board', async (m) => {
      if (!m.flags.matchOnly && !m.flags.onlyRound && !m.flags.activeOnly) {
        // SyncPlayers puts playersList and teams into context
        if (m.context.playersList && Object.keys(m.context.playersList).length > 0) {
          return syncBoard.run(m);
        } else {
          return { success: false, message: 'Cannot sync board without players list.' };
        }
      }
      return { success: true, message: 'Skipped Board sync.' };
    });

    manager.addStep('Sync Initial Squads', async (m) => {
      if (!m.flags.matchOnly && !m.flags.onlyRound && !m.flags.activeOnly) {
        return syncInitialSquads.run(m);
      }
      return { success: true, message: 'Skipped Initial Squads sync.' };
    });

    // --- PHASE 3: MATCHES & STATS ---
    manager.addStep('Sync Matches & Stats', async (m) => {
      if (m.flags.onlyMarket) {
        return { success: true, message: 'Skipped Matches & Stats (market only).' };
      }

      const db = m.context.db;
      // Get existing rounds to skip (incremental update for LINEUPS only)
      const existingLineupRoundsArr = db
        .prepare('SELECT DISTINCT round_id FROM lineups')
        .pluck()
        .all();
      const existingLineupRounds = new Set(existingLineupRoundsArr);
      const lastLineupRoundId =
        existingLineupRoundsArr.length > 0 ? Math.max(...existingLineupRoundsArr) : 0;

      let competitionWithRounds = m.context.competition;

      // Fetch rounds if missing (e.g. if we skipped player sync)
      const hasRounds =
        competitionWithRounds?.data?.data?.season || competitionWithRounds?.data?.season;

      if (!hasRounds) {
        m.log('   ℹ️ Fetching round list (light mode)...');
        const { fetchCompetition } = await import('../api/biwenger-client.js');
        const rawComp = await fetchCompetition();
        competitionWithRounds = { data: rawComp };
        m.context.competition = competitionWithRounds; // Store back in context
      }

      const rounds = competitionWithRounds.data.data
        ? competitionWithRounds.data.data.season.rounds
        : competitionWithRounds.data.season.rounds;

      if (!rounds) {
        m.error('Could not find rounds in competition data');
        return { success: false, message: 'No rounds found' };
      }

      m.log(`Found ${rounds.length} rounds in competition data.`);
      const roundNameMap = buildRoundNameMap(rounds);
      let totalLineupsInserted = 0;

      for (const round of rounds) {
        const originalName = round.name;
        const status = round.status;

        // m.log(`\n--- Processing ${originalName} (${status}) ---`); // Verbose log

        if (originalName === 'GLOBAL') continue;

        // FILTER: --only-round
        if (
          m.flags.onlyRound &&
          round.id.toString() !== m.flags.onlyRound &&
          round.name !== m.flags.onlyRound
        ) {
          continue;
        }

        // FILTER: --active-only
        if (m.flags.activeOnly && round.status === 'finished') {
          m.log(`   ⏭️ Skipping round ${round.name} (--active-only mode)`);
          continue;
        }

        // Normalize Round Name/ID
        const baseName = normalizeRoundName(originalName);
        const canonicalId = getCanonicalRoundId(round, roundNameMap);

        if (canonicalId !== round.id) {
          m.log(`   -> 🔀 Merging round ${round.id} into ${canonicalId} (${baseName})`);
          round.dbId = canonicalId;
          round.name = baseName;
        } else if (originalName.includes('(aplazada)')) {
          // console.warn(...) -> m.warn(...)
          round.name = baseName;
        }

        // 1. Sync Match Schedule
        if (!m.flags.skipEuroleague) {
          await syncMatches.run(m, round, m.context.playersList);
        } else {
          m.log(`   ⏭️ Skipping matches sync (EuroLeague skipped).`);
        }

        // 2. Sync Game Stats (Euroleague)
        const roundNumber = parseInt(baseName.replace(/\D/g, '')) || 0;
        if (roundNumber > 0) {
          // Get team count from sync_meta (set by syncEuroleagueMaster), fallback to 20
          const metaRow = db
            .prepare('SELECT value FROM sync_meta WHERE key = ?')
            .get('euroleague_team_count');
          const teamCount = metaRow ? parseInt(metaRow.value) : 20;
          const gamesPerRound = Math.floor(teamCount / 2);
          const startGameCode = (roundNumber - 1) * gamesPerRound + 1;
          const endGameCode = startGameCode + gamesPerRound - 1;

          // m.log(`   📊 Fetching Euroleague games ${startGameCode}-${endGameCode}...`);

          for (let gameCode = startGameCode; gameCode <= endGameCode; gameCode++) {
            if (!m.flags.skipEuroleague) {
              await syncEuroleagueStats.runGame(m, gameCode, round.dbId || round.id, round.name, {
                activeOnly: m.flags.activeOnly,
              });
            }
          }
        }

        // 3. Sync Fantasy Points (Biwenger)
        await syncEuroleagueStats.runBiwengerPoints(m, round, m.context.playersList);

        // 4. Sync Lineups
        const res = await syncLineups.run(
          m,
          round,
          existingLineupRounds,
          lastLineupRoundId,
          m.context.playersList
        );
        totalLineupsInserted += res.insertedCount || 0;
      } // end round loop

      return {
        success: true,
        message: `Matches, stats & lineups synced. (${totalLineupsInserted} lineups)`,
      };
    });

    // Execute Manager
    const summary = await manager.run();

    if (!summary.success) {
      console.error('❌ Sync process failed with errors.');
      process.exit(1);
    } else {
      console.log('\n✅ Sync process completed successfully.');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Critical Error in Sync Manager wrapper:', err);
    process.exit(1);
  }
}

syncData();
