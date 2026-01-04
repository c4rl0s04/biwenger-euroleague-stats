import { fetchAllPlayers, fetchPlayerDetails } from '../api/biwenger-client.js';
import { getShortTeamName } from '../utils/format.js';
import { CONFIG } from '../config.js';

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
 * @param {import('better-sqlite3').Database} db - Database instance
 * @returns {Promise<Object>} - The full competition data object
 */
export async function syncPlayers(db, options = {}) {
  console.log('\n📥 Fetching Players Database...');
  const competition = await fetchAllPlayers();

  const playersList = competition.data.data
    ? competition.data.data.players
    : competition.data.players;

  if (!playersList) {
    throw new Error('Could not find players list in competition data');
  }

  console.log(
    `Found ${Object.keys(playersList).length} players. Updating DB and fetching details...`
  );

  // --- 1. QUERY PREPARATION ---

  const insertPlayer = db.prepare(`
    INSERT INTO players (
      id, name, team_id, team, position, 
      puntos, partidos_jugados, 
      played_home, played_away, 
      points_home, points_away, points_last_season,
      status, price_increment, price
    ) 
    VALUES (
      @id, @name, @team_id, @team, @position, 
      @puntos, @partidos_jugados, 
      @played_home, @played_away, 
      @points_home, @points_away, 
      @points_last_season,
      @status, @price_increment, @price
    )
    ON CONFLICT(id) DO UPDATE SET 
      name=excluded.name, 
      team_id=excluded.team_id,
      team=excluded.team, 
      position=excluded.position,
      puntos=excluded.puntos,
      partidos_jugados=excluded.partidos_jugados,
      played_home=excluded.played_home,
      played_away=excluded.played_away,
      points_home=excluded.points_home,
      points_away=excluded.points_away,
      points_last_season=excluded.points_last_season,
      status=excluded.status,
      price_increment=excluded.price_increment,
      price=excluded.price
  `);

  const updatePlayerDetails = db.prepare(`
    UPDATE players 
    SET birth_date = @birth_date, height = @height, weight = @weight
    WHERE id = @id
  `);

  // NEW QUERY: Get last recorded date for a player
  const getLastDate = db.prepare(
    'SELECT max(date) as last_date FROM market_values WHERE player_id = ?'
  );

  const insertMarketValue = db.prepare(`
    INSERT OR IGNORE INTO market_values (player_id, price, date)
    VALUES (@player_id, @price, @date)
  `);

  const positions = CONFIG.POSITIONS;
  const teams =
    (competition.data.data ? competition.data.data.teams : competition.data.teams) || {};

  // --- 1.1 SYNC TEAMS ---
  console.log('Syncing Teams...');

  // --- 1.1 SYNC TEAMS ---
  console.log('Syncing Teams...');
  const insertTeam = db.prepare(`
    INSERT INTO teams (id, name, short_name, img) VALUES (@id, @name, @short_name, @img)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, short_name=excluded.short_name, img=excluded.img
  `);

  const teamTx = db.transaction(() => {
    for (const [teamId, teamData] of Object.entries(teams)) {
      insertTeam.run({
        id: parseInt(teamId),
        name: teamData.name,
        short_name: getShortTeamName(teamData.name),
        img: teamData.img || `https://cdn.biwenger.com/teams/${teamId}.png`, // Fallback
      });
    }
  });
  teamTx();
  console.log(`✅ Synced ${Object.keys(teams).length} teams.`);

  // --- 2. PROCESSING ---

  // Check options
  const skipDetails = options.skipDetails;
  if (skipDetails) {
    console.log(
      '   ⏩ Skipping detailed player fetch (CLI flag --no-details active). Prices/Bio will not be updated.'
    );
  }

  for (const [id, player] of Object.entries(playersList)) {
    const playerId = parseInt(id);

    // A) Basic Insertion
    insertPlayer.run({
      id: playerId,
      name: player.name,
      team_id: player.teamID,
      team: teams[player.teamID]?.name || 'Unknown',
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
    });

    // SKIP DETAILS IF FLAG IS SET
    if (skipDetails) continue;

    // B) Fetching Extended Details

    // OPTIMIZATION: Freshness check
    // If we already have a market value for TODAY (or very recent date), skip details.
    const today = new Date().toISOString().split('T')[0];
    const lastDateRow = getLastDate.get(playerId);
    const lastDate = lastDateRow ? lastDateRow.last_date : null;

    // If the last recorded date is TODAY (or later, just in case), skip
    // Unless forceDetails is true
    if (!options.forceDetails && lastDate && lastDate >= today) {
      // console.log(`   ⏭️ Skipped ${player.name} (Already updated for ${lastDate})`);
      continue;
    }

    try {
      await sleep(SLEEP_MS);

      const lookupId = player.slug || player.id || playerId;
      const details = await fetchPlayerDetails(lookupId);

      if (details.data) {
        const d = details.data;

        // B.1 Update physical data
        updatePlayerDetails.run({
          id: playerId,
          birth_date: parseBiwengerDate(d.birthday),
          height: d.height || null,
          weight: d.weight || null,
        });

        // B.2 Insert ONLY new prices (Optimization)
        if (d.prices && Array.isArray(d.prices)) {
          // 1. Query what we already have in the database (redundant variable but clear)
          // const lastDateRow = getLastDate.get(playerId);
          // const lastDate = lastDateRow ? lastDateRow.last_date : null;

          // 2. Filter: only dates AFTER the last one we have
          const newPrices = d.prices.filter(([dateInt]) => {
            // If we have no history, all are of interest (return true)
            if (!lastDate) return true;

            // Convert API date (250918) to SQL (2025-09-18) and compare
            const priceDate = parsePriceDate(dateInt);
            return priceDate > lastDate;
          });

          // 3. We only insert the delta (if there's something new)
          if (newPrices.length > 0) {
            const insertHistory = db.transaction((prices) => {
              for (const [dateInt, price] of prices) {
                insertMarketValue.run({
                  player_id: playerId,
                  price: price,
                  date: parsePriceDate(dateInt),
                });
              }
            });
            insertHistory(newPrices);
            // Opcional: Log para depurar
            // console.log(`   -> Added ${newPrices.length} new prices for ${player.name}`);
          }
        }
      }
    } catch (e) {
      const lookupId = player.slug || playerId;
      console.error(`   ⚠️ Error fetching details for ${player.name} (${lookupId}): ${e.message}`);
    }
  }

  console.log('✅ Players synced (Incremental market update).');

  return competition;
}
