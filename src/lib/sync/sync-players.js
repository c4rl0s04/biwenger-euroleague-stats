import { fetchAllPlayers } from '../biwenger-client.js';
import { CONFIG } from '../config.js';

/**
 * Syncs all players from the competition to the local database.
 * Also updates market values (current price).
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

  console.log(`Found ${Object.keys(playersList).length} players. Updating DB...`);
  
  const insertPlayer = db.prepare(`
    INSERT INTO players (
      id, name, team, position, 
      puntos, partidos_jugados, 
      played_home, played_away, 
      points_home, points_away, points_last_season
    ) 
    VALUES (
      @id, @name, @team, @position, 
      @puntos, @partidos_jugados, 
      @played_home, @played_away, 
      @points_home, @points_away, @points_last_season
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
      points_last_season=excluded.points_last_season
  `);

  // Also prepare to insert current price into market_values for ALL players
  const insertMarketValue = db.prepare(`
    INSERT OR IGNORE INTO market_values (player_id, price, date)
    VALUES (@player_id, @price, @date)
  `);
  
  const today = new Date().toISOString().split('T')[0];

  // Helper to map position ID to text
  // 1 -> Base, 2 -> Alero, 3 -> Pivot
  const positions = CONFIG.POSITIONS; 
  const teams = (competition.data.data ? competition.data.data.teams : competition.data.teams) || {};

  db.transaction(() => {
    for (const [id, player] of Object.entries(playersList)) {
      // Insert Player
      insertPlayer.run({
        id: parseInt(id),
        name: player.name,
        team: teams[player.teamID]?.name || 'Unknown',
        position: positions[player.position] || 'Unknown',
        
        // New Stats
        puntos: player.points || 0,
        partidos_jugados: (player.playedHome || 0) + (player.playedAway || 0),
        played_home: player.playedHome || 0,
        played_away: player.playedAway || 0,
        points_home: player.pointsHome || 0,
        points_away: player.pointsAway || 0,
        points_last_season: player.pointsLastSeason || 0
      });

      // Insert Price (if exists)
      if (player.price) {
        insertMarketValue.run({
          player_id: parseInt(id),
          price: player.price,
          date: today
        });
      }
    }
  })();
  console.log('✅ Players and current prices synced.');
  
  // Return competition data for other modules (like rounds list)
  return competition;
}
