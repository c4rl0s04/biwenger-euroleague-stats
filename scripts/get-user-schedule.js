import { db } from '../src/lib/db/client.js';

// Get User ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a User ID.');
  console.error('Usage: node scripts/get-user-schedule.js <USER_ID>');
  process.exit(1);
}

try {
  console.log(`\n🔍 Finding next matches for User ID: ${userId}...\n`);

  // 1. Find the ID of the next upcoming round
  const nextRoundQuery = `
    SELECT round_id, round_name 
    FROM matches 
    WHERE date > datetime('now') 
    ORDER BY date ASC 
    LIMIT 1
  `;
  
  const nextRound = db.prepare(nextRoundQuery).get();

  if (!nextRound) {
    console.log('✅ No upcoming rounds found.');
    process.exit(0);
  }

  console.log(`📅 Round: ${nextRound.round_name} (ID: ${nextRound.round_id})`);
  console.log('─'.repeat(50));

  // 2. Get all matches for this round, ordered by date
  const matchesQuery = `
    SELECT 
      m.id as match_id,
      m.date,
      m.home_id,
      m.away_id,
      th.name as home_team,
      ta.name as away_team
    FROM matches m
    LEFT JOIN teams th ON m.home_id = th.id
    LEFT JOIN teams ta ON m.away_id = ta.id
    WHERE m.round_id = ?
    ORDER BY m.date ASC
  `;

  const matches = db.prepare(matchesQuery).all(nextRound.round_id);

  // 3. Get the user's players
  // We grab the team_id to match against the schedule
  const playersQuery = `
    SELECT 
      p.id,
      p.name,
      p.team_id,
      t.name as team_name,
      p.position
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.owner_id = ?
  `;

  const userPlayers = db.prepare(playersQuery).all(userId);

  if (userPlayers.length === 0) {
    console.log('⚠️ This user has no players in their squad.');
    process.exit(0);
  }

  // 4. Group players by match and display
  let playersFoundCount = 0;

  matches.forEach((match) => {
    // Find players playing in this match (either home or away)
    const matchPlayers = userPlayers.filter(
      (p) => p.team_id === match.home_id || p.team_id === match.away_id
    );

    if (matchPlayers.length > 0) {
      playersFoundCount += matchPlayers.length;

      // Format Date
      const date = new Date(match.date);
      const dateStr = date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Output Match Header
      console.log(`\n ${match.home_team} vs ${match.away_team}`);
      console.log(`   🕒 ${dateStr} at ${timeStr}`);

      // Output Players
      matchPlayers.forEach((player) => {
        const isHome = player.team_id === match.home_id;
        const side = isHome ? '(Home)' : '(Away)';
        console.log(`      👤 ${player.name.padEnd(25)} [${player.team_name}]`);
      });
    }
  });

  if (playersFoundCount === 0) {
    console.log('\n❌ No players from this user have matches in the upcoming round.');
  } else {
    console.log('\n' + '─'.repeat(50));
    console.log(`✅ Total players playing: ${playersFoundCount}`);
  }

} catch (error) {
  console.error('❌ Error executing script:', error.message);
}