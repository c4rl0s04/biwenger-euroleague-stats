// Obtener todas las estadísticas disponibles de un jugador

async function getAllPlayerStats() {
  console.log('🔍 Obteniendo estadísticas completas de jugadores...\n');
  
  // Probar varias jornadas para encontrar datos
  const roundIds = [4757, 4756, 4755, 4754]; // Jornadas 12, 11, 10, 9
  
  for (const roundId of roundIds) {
    console.log(`Probando Jornada ID: ${roundId}`);
    const response = await fetch(`https://biwenger.as.com/api/v2/rounds/euroleague/${roundId}?score=1&lang=es`);
    const data = await response.json();
    
    console.log(`  Round: ${data.data.name}, Status: ${data.data.status}`);
    
    // Buscar un partido con datos de jugadores
    for (const game of data.data.games) {
      if (game.players && Object.keys(game.players).length > 0) {
        const playerId = Object.keys(game.players)[0];
        const player = game.players[playerId];
        
        console.log('\n✅ ¡ENCONTRADO! Jugador con estadísticas completas:');
        console.log(`Partido: ${game.home.name} vs ${game.away.name}`);
        console.log(`Jugador: ${player.player.name} (ID: ${player.player.id})`);
        console.log(`Puntos Biwenger: ${player.points}`);
        console.log(`Equipo ID: ${player.player.team?.id || 'N/A'}`);
        
        console.log('\n📊 TODAS LAS ESTADÍSTICAS DISPONIBLES:\n');
        console.log('═'.repeat(60));
        
        if (player.stats && Array.isArray(player.stats)) {
          player.stats.forEach((stat, index) => {
            const nombre = stat[0];
            const valor = stat[1];
            console.log(`${index + 1}. ${nombre.padEnd(30)} → ${valor}`);
          });
          
          console.log('\n' + '═'.repeat(60));
          console.log('\n💡 COLUMNAS PROPUESTAS (sin JSON):');
          console.log('\nCOLUMNAS BÁSICAS:');
          console.log('  • round_id (INTEGER)');
          console.log('  • player_id (INTEGER)');
          console.log('  • game_id (INTEGER)');
          console.log('  • team_id (INTEGER)');
          console.log('  • position (INTEGER)');
          console.log('  • points (INTEGER) - Puntos Biwenger');
          
          console.log('\nESTADÍSTICAS INDIVIDUALES:');
          player.stats.forEach((stat) => {
            const nombre = stat[0];
            // Convertir nombre español a nombre de columna SQL
            let columnName = nombre.toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[áàä]/g, 'a')
              .replace(/[éèë]/g, 'e')
              .replace(/[íìï]/g, 'i')
              .replace(/[óòö]/g, 'o')
              .replace(/[úùü]/g, 'u')
              .replace(/ñ/g, 'n')
              .replace(/[^a-z0-9_]/g, '');
            
            console.log(`  • ${columnName} (INTEGER) -- "${nombre}"`);
          });
        } else {
          console.log('No hay array de stats');
        }
        
        return; // Salir cuando encontremos uno
      }
    }
  }
  
  console.log('\n⚠️ No se encontraron jugadores con estadísticas en las jornadas probadas');
}

getAllPlayerStats();
