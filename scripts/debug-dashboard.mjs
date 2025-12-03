import { getNextRound, getTopPlayers, getRecentTransfers, getStandings } from '../src/lib/database.js';

console.log('🔍 Debugging Dashboard Functions...');

try {
  console.log('1. Testing getNextRound()...');
  const nextRound = getNextRound();
  console.log('✅ Next Round:', nextRound);

  console.log('2. Testing getTopPlayers(5)...');
  const topPlayers = getTopPlayers(5);
  console.log('✅ Top Players:', topPlayers.length);

  console.log('3. Testing getRecentTransfers(5)...');
  const transfers = getRecentTransfers(5);
  console.log('✅ Recent Transfers:', transfers.length);

  console.log('4. Testing getStandings()...');
  const standings = getStandings();
  console.log('✅ Standings:', standings.length);
  if (standings.length > 0) {
      console.log('Sample Standing:', standings[0]);
  }

} catch (error) {
  console.error('❌ Error:', error);
}
