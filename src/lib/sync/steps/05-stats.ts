import * as syncEuroleagueStats from '../services/euroleague/stats';
import { fetchSchedule } from '../../api/euroleague-client';
import { CONFIG } from '../../config';
import { prepareEuroleagueMutations } from '../../db/mutations/euroleague';
import { SyncManager } from '../manager';

/**
 * Step 5: Sync Player Stats
 * - Syncs Euroleague Boxscores (Points, Rebounds, etc)
 * - Syncs Biwenger Fantasy Points
 * @param manager
 */
export async function run(manager: SyncManager) {
  manager.log('\n📊 Step 5: Syncing Player Stats...');
  const db = manager.context.db;
  const competition = manager.context.competition;

  let rounds =
    (competition as any)?.data?.rounds ||
    (competition as any)?.data?.season?.rounds ||
    (competition as any)?.data?.data?.season?.rounds ||
    (competition as any)?.rounds;

  // If missing (standalone run), fetch it
  if (!rounds) {
    manager.log('   ⚠️ Competition context missing. Fetching from API...');
    const { fetchCompetition } = await import('../../api/biwenger-client');
    const compData = await fetchCompetition();
    rounds =
      compData?.data?.rounds ||
      compData?.data?.season?.rounds ||
      compData?.data?.data?.season?.rounds ||
      compData?.rounds;
    if (!rounds) throw new Error('Could not fetch competition rounds data.');
  }

  // Ensure Players List is populated (for isolation run)
  if (!manager.context.playersList || Object.keys(manager.context.playersList).length === 0) {
    manager.log('   ⚠️ Players list missing. Fetching from DB...');
    const res = await (db as any).query('SELECT id, name FROM players');
    manager.context.playersList = res.rows.reduce((acc: any, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});
    manager.log(`   Fetched ${res.rows.length} players from DB.`);
  }

  // Prepare Mappings
  const mutations = prepareEuroleagueMutations(db as any);
  const teams = await mutations.getTeamsWithCode();
  const teamCodeMap = new Map(teams.map((t: any) => [t.id, t.code]));

  // --- FIX: Populate Round Name Map for Duplicates ---
  manager.log('   🗺️  Building Canonical Round Map...');
  const nameToId = new Map();
  // Sort rounds by ID to ensure we pick the lowest (original) ID first
  const sortedRounds = [...rounds].sort((a, b) => a.id - b.id);

  for (const r of sortedRounds) {
    const norm = manager.normalizeRoundName(r.name);
    // If we haven't seen this "Base Name" yet, this ID is the canonical one
    if (!nameToId.has(norm)) {
      nameToId.set(norm, r.id);
    }
  }
  // Initialize manager map
  manager.roundNameMap = nameToId;
  manager.log(`   ✅ Mapped ${rounds.length} rounds to ${nameToId.size} canonical IDs.`);
  // ---------------------------------------------------

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
  } catch (e: any) {
    manager.error(`   ❌ Failed to fetch schedule key for stats mapping: ${e.message}`);
  }

  let eliminatoriaCount = 1;
  for (const round of sortedRounds) {
    const baseName = round.name;

    // Filter Rounds (Same logic as matches)
    if (
      !baseName.includes('Jornada') &&
      !baseName.includes('Playoff') &&
      !baseName.includes('Final Four') &&
      !baseName.includes('Eliminatoria') &&
      !baseName.includes('Play-In')
    )
      continue;

    // --- Normalize Round Name for DB Consistency ---
    const normalizedName = manager.normalizeRoundName(baseName);
    const finalName =
      normalizedName === 'Eliminatoria' ? `Eliminatoria ${eliminatoriaCount++}` : normalizedName;

    // Create a copy for downstream
    const roundToSync = { ...round, name: finalName };

    // OPTIMIZATION: Daily Mode
    if (manager.context.isDaily) {
      const roundId = manager.resolveRoundId(roundToSync);
      try {
        const res = await (manager.context.db as any).query(
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

          // 1. Skip if Completed AND Old (older than 24h)
          // We must run if it JUST finished to get final stats.
          const lastMatchTime = row.last_match_date ? new Date(row.last_match_date).getTime() : 0;
          const isRecent = now.getTime() - lastMatchTime < 24 * 60 * 60 * 1000;

          if (row.all_finished && !isRecent) {
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

    manager.log(`\n🔹 Processing Stats for ${finalName} (original: ${baseName})...`);

    // 1. Sync Euroleague Boxscores (Robust Schedule-Based Sync)

    // Fetch Matches for this round from DB
    // Fetch Matches for this round from DB
    const roundId = manager.resolveRoundId(roundToSync);

    // IMPORTANT: Attach canonical ID so downstream functions use it for INSERT/UPDATE
    roundToSync.dbId = roundId;

    const dbMatches = await mutations.getMatchesByRound(roundId);

    if (dbMatches.length === 0) {
      manager.log(`   ⚠️ No matches found in DB for ${finalName}. Run Step 3 first?`);
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
        await syncEuroleagueStats.runGame(manager, gameCode, roundId, finalName);
        syncedGames++;
      }
    }
    if (syncedGames === 0 && dbMatches.length > 0) {
      manager.log('   ⚠️ No Euroleague mapped games found for any match in this round.');
    }

    // 2. Sync Biwenger Fantasy Points
    await syncEuroleagueStats.runBiwengerPoints(manager, roundToSync, manager.context.playersList);
  }

  return { success: true, message: 'Synced player stats.' };
}
