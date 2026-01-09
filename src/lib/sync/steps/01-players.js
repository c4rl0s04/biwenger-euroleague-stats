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
const parsePriceDate = (dateInt) => {
  const str = dateInt.toString();
  const year = '20' + str.substring(0, 2);
  const month = str.substring(2, 4);
  const day = str.substring(4, 6);
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

  // --- 1.1 SYNC TEAMS ---
  manager.log('Syncing Teams...');

  const teamTx = db.transaction(() => {
    for (const [teamId, teamData] of Object.entries(teams)) {
      mutations.upsertTeam({
        id: parseInt(teamId),
        name: teamData.name,
        short_name: getShortTeamName(teamData.name),
        img: teamData.img || `https://cdn.biwenger.com/teams/${teamId}.png`, // Fallback
      });
    }
  });
  teamTx();
  // manager.log(`✅ Synced ${Object.keys(teams).length} teams.`); // Let manager handle success log

  // --- 2. PROCESSING ---

  // No flags or options to check in Simplification V2

  for (const [id, player] of Object.entries(playersList)) {
    const playerId = parseInt(id);

    // A) Basic Insertion
    mutations.upsertPlayer({
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

    // B) Fetching Extended Details (Always)

    try {
      await sleep(SLEEP_MS);

      const lookupId = player.slug || player.id || playerId;
      const details = await fetchPlayerDetails(lookupId);

      if (details.data) {
        const d = details.data;

        // B.1 Update physical data
        mutations.updatePlayerDetails({
          id: playerId,
          birth_date: parseBiwengerDate(d.birthday),
          height: d.height || null,
          weight: d.weight || null,
        });

        // B.2 Insert market values (Historical prices)
        if (d.prices && Array.isArray(d.prices)) {
          const insertHistory = db.transaction((prices) => {
            for (const [dateInt, price] of prices) {
              const priceDate = parsePriceDate(dateInt);
              mutations.insertMarketValue({
                player_id: playerId,
                price: price,
                date: priceDate,
              });
            }
          });

          insertHistory(d.prices);
        }
      }
    } catch (e) {
      const lookupId = player.slug || playerId;
      manager.error(`   ⚠️ Error fetching details for ${player.name} (${lookupId}): ${e.message}`);
    }
  }

  // Legacy return to maintain potential compatibility if called directly (though index.js will use manager)
  // But for manager pattern, we return success object
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
