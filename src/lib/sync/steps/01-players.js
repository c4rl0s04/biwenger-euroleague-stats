import { fetchAllPlayers, fetchPlayerDetails } from '../../api/biwenger-client.js';
import { getShortTeamName } from '../../utils/format.js';
import { CONFIG } from '../../config.js';
import { preparePlayerMutations } from '../../db/mutations/players.js';

const SLEEP_MS = 600; // Mantenemos la pausa segura para evitar el error 429

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: 19970121 -> "1997-01-21"
const parseBiwengerDate = (dateInt) => {
  if (!dateInt) return null;
  const str = dateInt.toString();
  if (str.length !== 8) return null;
  const year = str.substring(0, 4);
  const month = str.substring(4, 6);
  const day = str.substring(6, 8);
  return `${year}-${month}-${day}`;
};

// Helper: 250918 -> "2025-09-18" (para precios)
// Helper: 260120 -> "2020-01-26" (Handling YYDDMM edge case if Month > 12)
const parsePriceDate = (dateInt) => {
  const str = dateInt.toString();
  let year = '20' + str.substring(0, 2);
  let month = str.substring(2, 4);
  let day = str.substring(4, 6);

  // Fallback for weird Biwenger formats where Day/Month might be swapped
  // If Month > 12, it must be the Day
  if (parseInt(month) > 12) {
    const temp = month;
    month = day;
    day = temp;
  }

  // Double check robustness
  if (parseInt(month) > 12) {
    // If still invalid, default to Jan 1st to avoid crash
    console.warn(`Invalid date encountered: ${dateInt}. Defaulting to ${year}-01-01`);
    return `${year}-01-01`;
  }

  return `${year}-${month}-${day}`;
};

/**
 * Syncs all players from the competition to the local database.
 * Optimized to only insert new market values.
 * @param {import('./manager').SyncManager} manager - Sync manager instance
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
export async function run(manager) {
  const db = manager.context.db;
  manager.log('\n📥 Fetching Players Database...');
  const competition = await fetchAllPlayers();

  // --- 0. PREPARE ROUND MAPPING (Fix Duplicate Rounds) ---
  const rounds = competition.data.rounds || competition.data.season?.rounds || [];
  if (rounds.length > 0) {
    manager.log('   🔄 Building Canonical Round Map...');
    for (const r of rounds) {
      const baseName = manager.normalizeRoundName(r.name);

      // If baseName not in map OR we found a lower ID, update map
      // We want the LOWEST ID to be the canonical one
      if (!manager.roundNameMap.has(baseName) || r.id < manager.roundNameMap.get(baseName)) {
        manager.roundNameMap.set(baseName, r.id);
      }
    }
    manager.log(
      `      Found ${manager.roundNameMap.size} unique rounds from ${rounds.length} total.`
    );
  }

  const playersList = competition.data.data
    ? competition.data.data.players
    : competition.data.players;

  if (!playersList) {
    throw new Error('Could not find players list in competition data');
  }

  manager.log(
    `Found ${Object.keys(playersList).length} players. Updating DB and fetching details...`
  );

  // Store context for next steps
  manager.context.competition = competition;
  manager.context.playersList = playersList;
  manager.context.teams =
    (competition.data.data ? competition.data.data.teams : competition.data.teams) || {};

  // --- 1. QUERY PREPARATION ---
  const mutations = preparePlayerMutations(db);
  const positions = CONFIG.POSITIONS; // Position map
  const teams = manager.context.teams;

  // Optimized: Get existing player IDs to avoid redundant API calls
  const resExisting = await db.query('SELECT id FROM players');
  const existingPlayerIds = new Set(resExisting.rows.map((p) => p.id));
  manager.log(`   ℹ️ Found ${existingPlayerIds.size} existing players in DB.`);

  // --- 1.1 SYNC TEAMS ---
  manager.log('Syncing Teams...');

  // Async Loop for Teams (No Transaction in PG Pool without client checkout, sequential is fine)
  for (const [teamId, teamData] of Object.entries(teams)) {
    await mutations.upsertTeam({
      id: parseInt(teamId),
      name: teamData.name,
      short_name: getShortTeamName(teamData.name),
      img: teamData.img || `https://cdn.biwenger.com/teams/${teamId}.png`, // Fallback
    });
  }

  // --- 2. PROCESSING ---
  let newPlayersCount = 0;
  let skippedDetailsCount = 0;

  for (const [id, player] of Object.entries(playersList)) {
    const playerId = parseInt(id);

    // A) Basic Insertion (Always update basics like status, points, price)
    await mutations.upsertPlayer({
      id: playerId,
      name: player.name,
      team_id: player.teamID,
      position: positions[player.position] || 'Unknown',
      puntos: player.points || 0,
      partidos_jugados: (player.playedHome || 0) + (player.playedAway || 0),
      played_home: player.playedHome || 0,
      played_away: player.playedAway || 0,
      points_home: player.pointsHome || 0,
      points_away: player.pointsAway || 0,
      points_last_season: player.pointsLastSeason || 0,
      status: player.status || 'ok',
      price_increment: player.priceIncrement || 0,
      price: player.price || 0,
      img: player.img || null,
    });

    // B) Market Value Update (Always update current price for everyone)
    // Use today's date for the price entry
    // COMPETITION DATA doesn't have a specific date for the price, but it implies "Current".
    // We use a generated date string for "today".
    const todayInt = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD (Biwenger format)
    const priceDate = parsePriceDate(todayInt); // Returns YYYY-MM-DD

    await mutations.insertMarketValue({
      player_id: playerId,
      price: player.price || 0,
      date: priceDate,
    });

    // C) Fetching Extended Details (Conditional)
    const isNewPlayer = !existingPlayerIds.has(playerId);

    if (isNewPlayer) {
      // It's a NEW player. We MUST fetch details (History, Bio, etc.)
      try {
        await sleep(SLEEP_MS);
        newPlayersCount++;

        const lookupId = player.slug || player.id || playerId;
        const details = await fetchPlayerDetails(lookupId);

        if (details.data) {
          const d = details.data;

          // C.1 Update physical data
          await mutations.updatePlayerDetails({
            id: playerId,
            birth_date: parseBiwengerDate(d.birthday),
            height: d.height || null,
            weight: d.weight || null,
          });

          // C.2 Insert FULL market value history (only for new players)
          if (d.prices && Array.isArray(d.prices)) {
            // Sequential insert loop
            for (const [dateInt, price] of d.prices) {
              const dateStr = parsePriceDate(dateInt);
              await mutations.insertMarketValue({
                player_id: playerId,
                price: price,
                date: dateStr,
              });
            }
          }
        }
      } catch (e) {
        const lookupId = player.slug || playerId;
        manager.error(
          `   ⚠️ Error fetching details for NEW player ${player.name} (${lookupId}): ${e.message}`
        );
      }
    } else {
      // Existing player - Skip expensive details fetch
      skippedDetailsCount++;
    }
  }

  manager.log(`   ✨ New Players Detected: ${newPlayersCount} (Fetched full details)`);
  manager.log(
    `   ⏩ Existing Players: ${skippedDetailsCount} (Skipped details fetch, updated price)`
  );

  return {
    success: true,
    message: `Players synced. (${Object.keys(teams).length} teams, ${Object.keys(playersList).length} players)`,
    data: competition,
  };
}

// Keep legacy export for backward compatibility during migration if needed
export const syncPlayers = async (db, options) => {
  // Minimal mock manager for direct calls
  const mockManager = {
    context: { db, playersList: {}, teams: {} },
    // Flags object removed for legacy support
    log: console.log,
    error: console.error,
  };
  const result = await run(mockManager);
  return result.data;
};
