import * as syncEuroleagueStats from '../services/euroleague/stats.js';
import { fetchSchedule } from '../../api/euroleague-client.js';
import { CONFIG } from '../../config.js';
import { prepareEuroleagueMutations } from '../../db/mutations/euroleague.js';

/**
 * Step 5: Sync Player Stats
 * - Syncs Euroleague Boxscores (Points, Rebounds, etc)
 * - Syncs Biwenger Fantasy Points
 * @param {import('../manager').SyncManager} manager
 */
export async function run(manager) {
  manager.log('\n📊 Step 5: Syncing Player Stats...');
  const db = manager.context.db;
  const competition = manager.context.competition;

  const rounds =
    competition?.data?.rounds ||
    competition?.data?.season?.rounds ||
    competition?.data?.data?.season?.rounds;
  if (!rounds) throw new Error('Competition rounds data missing.');

  // Prepare Mappings
  const mutations = prepareEuroleagueMutations(db);
  const teams = await mutations.getTeamsWithCode();
  const teamCodeMap = new Map(teams.map((t) => [t.id, t.code]));

  // Fetch Euroleague Schedule Map (HOME_AWAY -> GameCode)
  manager.log('   📅 Fetching full Euroleague Schedule...');
  let gameCodeMap = new Map();
  try {
    const schedule = await fetchSchedule(CONFIG.EUROLEAGUE.SEASON_CODE);

    if (schedule?.schedule?.item) {
      const items = Array.isArray(schedule.schedule.item)
        ? schedule.schedule.item
        : [schedule.schedule.item];
      for (const item of items) {
        if (item.homecode && item.awaycode && item.game) {
          gameCodeMap.set(`${item.homecode.trim()}_${item.awaycode.trim()}`, item.game);
        }
      }
    }
    manager.log(`   ✅ Loaded schedule map: ${gameCodeMap.size} games.`);
  } catch (e) {
    manager.error(`   ❌ Failed to fetch schedule key for stats mapping: ${e.message}`);
  }

  for (const round of rounds) {
    const baseName = round.name;

    // Filter Rounds (Same logic as matches)
    if (
      !baseName.includes('Jornada') &&
      !baseName.includes('Playoff') &&
      !baseName.includes('Final Four')
    )
      continue;

    // OPTIMIZATION: Daily Mode
    if (manager.context.isDaily) {
      const roundId = round.dbId || round.id;
      try {
        const res = await manager.context.db.query(
          `SELECT 
                    MAX(date) as last_match_date, 
                    MIN(date) as first_match_date,
                    BOOL_AND(status = 'finished') as all_finished,
                    COUNT(*) as match_count
                 FROM matches 
                 WHERE round_id = $1`,
          [roundId]
        );

        const row = res.rows[0];
        if (row && row.match_count > 0) {
          const now = new Date();

          // 1. Skip if Completed
          if (row.all_finished) {
            continue;
          }

          // 2. Skip if Future
          if (row.first_match_date && new Date(row.first_match_date) > now) {
            continue;
          }
        }
      } catch (e) {
        // ignore error, sync anyway
      }
    }

    manager.log(`\n🔹 Processing Stats for ${baseName}...`);

    // 1. Sync Euroleague Boxscores (Robust Schedule-Based Sync)

    // Fetch Matches for this round from DB
    const dbMatches = await mutations.getMatchesByRound(round.dbId || round.id);

    if (dbMatches.length === 0) {
      manager.log(`   ⚠️ No matches found in DB for ${baseName}. Run Step 3 first?`);
    }

    let syncedGames = 0;
    for (const match of dbMatches) {
      const homeCode = teamCodeMap.get(match.home_id);
      const awayCode = teamCodeMap.get(match.away_id);

      if (!homeCode || !awayCode) {
        continue;
      }

      // Euroleague schedule keys usually trimmed
      const gameKey = `${homeCode.trim()}_${awayCode.trim()}`;
      const gameCode = gameCodeMap.get(gameKey);

      if (gameCode) {
        await syncEuroleagueStats.runGame(manager, gameCode, round.dbId || round.id, round.name);
        syncedGames++;
      }
    }
    if (syncedGames === 0 && dbMatches.length > 0) {
      manager.log('   ⚠️ No Euroleague mapped games found for any match in this round.');
    }

    // 2. Sync Biwenger Fantasy Points
    await syncEuroleagueStats.runBiwengerPoints(manager, round, manager.context.playersList);
  }

  return { success: true, message: 'Synced player stats.' };
}
