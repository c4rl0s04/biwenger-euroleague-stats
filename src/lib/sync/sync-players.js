import { fetchAllPlayers, fetchPlayerDetails } from '../api/biwenger-client.js';
import { CONFIG } from '../config.js';

const SLEEP_MS = 600; // Mantenemos la pausa segura para evitar el error 429

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    const year = "20" + str.substring(0, 2);
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
export async function syncPlayers(db) {
  console.log('\n📥 Fetching Players Database...');
  const competition = await fetchAllPlayers();
  
  const playersList = competition.data.data ? competition.data.data.players : competition.data.players;
  
  if (!playersList) {
    throw new Error('Could not find players list in competition data');
  }

  console.log(`Found ${Object.keys(playersList).length} players. Updating DB and fetching details...`);
  
  // --- 1. PREPARACIÓN DE QUERIES ---

  const insertPlayer = db.prepare(`
    INSERT INTO players (
      id, name, team, position, 
      puntos, partidos_jugados, 
      played_home, played_away, 
      points_home, points_away, points_last_season,
      status, price_increment, price
    ) 
    VALUES (
      @id, @name, @team, @position, 
      @puntos, @partidos_jugados, 
      @played_home, @played_away, 
      @points_home, @points_away, @points_last_season,
      @status, @price_increment, @price
    )
    ON CONFLICT(id) DO UPDATE SET 
      name=excluded.name, 
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

  // NUEVA QUERY: Obtener la última fecha registrada para un jugador
  const getLastDate = db.prepare('SELECT max(date) as last_date FROM market_values WHERE player_id = ?');

  const insertMarketValue = db.prepare(`
    INSERT OR IGNORE INTO market_values (player_id, price, date)
    VALUES (@player_id, @price, @date)
  `);
  
  const positions = CONFIG.POSITIONS; 
  const teams = (competition.data.data ? competition.data.data.teams : competition.data.teams) || {};

  // --- 2. PROCESAMIENTO ---

  for (const [id, player] of Object.entries(playersList)) {
      const playerId = parseInt(id);

      // A) Inserción Básica
      insertPlayer.run({
        id: playerId,
        name: player.name,
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
        price: player.price || 0
      });

      // B) Obtención de Detalles Extendidos
      
      // OPTIMIZACIÓN: Chequeo de frescura
      // Si ya tenemos un valor de mercado para HOY (o fecha muy reciente), no pedimos detalles.
      const today = new Date().toISOString().split('T')[0];
      const lastDateRow = getLastDate.get(playerId);
      const lastDate = lastDateRow ? lastDateRow.last_date : null;

      // Si la última fecha registrada es HOY (o mayor, por si acaso), saltamos
      if (lastDate && lastDate >= today) {
          // console.log(`   ⏭️ Skipped ${player.name} (Already updated for ${lastDate})`);
          continue; 
      }

      try {
          await sleep(SLEEP_MS);
          
          const lookupId = player.slug || playerId;
          const details = await fetchPlayerDetails(lookupId);
          
          if (details.data) {
              const d = details.data;

              // B.1 Actualizar datos físicos
              updatePlayerDetails.run({
                  id: playerId,
                  birth_date: parseBiwengerDate(d.birthday),
                  height: d.height || null,
                  weight: d.weight || null
              });

              // B.2 Insertar SOLO precios nuevos (Optimización)
              if (d.prices && Array.isArray(d.prices)) {
                  
                  // 1. Consultamos qué tenemos ya en la base de datos (redundante variable pero claro)
                  // const lastDateRow = getLastDate.get(playerId); 
                  // const lastDate = lastDateRow ? lastDateRow.last_date : null;

                  // 2. Filtramos: solo nos interesan las fechas POSTERIORES a la última que tenemos
                  const newPrices = d.prices.filter(([dateInt]) => {
                      // Si no tenemos historial, nos interesan todos (return true)
                      if (!lastDate) return true;
                      
                      // Convertimos fecha API (250918) a SQL (2025-09-18) y comparamos
                      const priceDate = parsePriceDate(dateInt);
                      return priceDate > lastDate;
                  });

                  // 3. Insertamos solo el delta (si hay algo nuevo)
                  if (newPrices.length > 0) {
                      const insertHistory = db.transaction((prices) => {
                          for (const [dateInt, price] of prices) {
                              insertMarketValue.run({
                                  player_id: playerId,
                                  price: price,
                                  date: parsePriceDate(dateInt)
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