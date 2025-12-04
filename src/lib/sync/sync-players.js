import { fetchAllPlayers, fetchPlayerDetails } from '../biwenger-client.js';
import { CONFIG } from '../config.js';

const SLEEP_MS = 600; // Pausa para no saturar la API

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
 * Also updates market values (current price) and fetches extended details.
 * @param {import('better-sqlite3').Database} db - Database instance
 * @returns {Promise<Object>} - The full competition data object
 */
export async function syncPlayers(db) {
  console.log('\n📥 Fetching Players Database...');
  const competition = await fetchAllPlayers();
  
  // Structure is usually data.data.players
  const playersList = competition.data.data ? competition.data.data.players : competition.data.players;
  
  if (!playersList) {
    throw new Error('Could not find players list in competition data');
  }

  console.log(`Found ${Object.keys(playersList).length} players. Updating DB and fetching details...`);
  
  // 1. PREPARACIÓN DE QUERIES

  // Query Original (MODIFICADA: Se ha eliminado img_url)
  const insertPlayer = db.prepare(`
    INSERT INTO players (
      id, name, team, position, 
      puntos, partidos_jugados, 
      played_home, played_away, 
      points_home, points_away, points_last_season,
      status, price_increment
    ) 
    VALUES (
      @id, @name, @team, @position, 
      @puntos, @partidos_jugados, 
      @played_home, @played_away, 
      @points_home, @points_away, @points_last_season,
      @status, @price_increment
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
      price_increment=excluded.price_increment
  `);

  // Nueva Query: Actualizar solo los detalles físicos y fecha
  const updatePlayerDetails = db.prepare(`
    UPDATE players 
    SET birth_date = @birth_date, height = @height, weight = @weight
    WHERE id = @id
  `);

  // Query Mercado (Sirve para el historial completo)
  const insertMarketValue = db.prepare(`
    INSERT OR IGNORE INTO market_values (player_id, price, date)
    VALUES (@player_id, @price, @date)
  `);
  
  const positions = CONFIG.POSITIONS; 
  const teams = (competition.data.data ? competition.data.data.teams : competition.data.teams) || {};

  // 2. PROCESAMIENTO

  for (const [id, player] of Object.entries(playersList)) {
      const playerId = parseInt(id);

      // A) Inserción Básica (Sin img_url)
      insertPlayer.run({
        id: playerId,
        name: player.name,
        team: teams[player.teamID]?.name || 'Unknown',
        position: positions[player.position] || 'Unknown',
        
        // Stats originales
        puntos: player.points || 0,
        partidos_jugados: (player.playedHome || 0) + (player.playedAway || 0),
        played_home: player.playedHome || 0,
        played_away: player.playedAway || 0,
        points_home: player.pointsHome || 0,
        points_away: player.pointsAway || 0,
        points_last_season: player.pointsLastSeason || 0,
        
        // Enhanced Data
        status: player.status || 'ok',
        price_increment: player.priceIncrement || 0
      });

      // B) Obtención de Detalles Extendidos
      try {
          // Pausa de cortesía a la API
          await sleep(SLEEP_MS);
          
          // Usamos el slug si existe, si no, el ID
          const lookupId = player.slug || playerId;

          // Llamada al endpoint optimizado
          const details = await fetchPlayerDetails(lookupId);
          
          if (details.data) {
              const d = details.data;

              // B.1 Actualizamos los datos físicos en la tabla players
              updatePlayerDetails.run({
                  id: playerId, // Siempre usamos el ID numérico para guardar en DB
                  birth_date: parseBiwengerDate(d.birthday),
                  height: d.height || null,
                  weight: d.weight || null
              });

              // B.2 Insertamos TODO el historial de precios
              if (d.prices && Array.isArray(d.prices)) {
                  const insertHistory = db.transaction((prices) => {
                      for (const [dateInt, price] of prices) {
                          insertMarketValue.run({
                              player_id: playerId,
                              price: price,
                              date: parsePriceDate(dateInt)
                          });
                      }
                  });
                  insertHistory(d.prices);
              }
          }
      } catch (e) {
          // Log mejorado para ver qué ID falló
          const lookupId = player.slug || playerId;
          console.error(`   ⚠️ Error fetching details for ${player.name} (${lookupId}): ${e.message}`);
      }
  }

  console.log('✅ Players (with full stats) and market history synced.');
  
  // Return competition data for other modules
  return competition;
}