import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbVal = new Database(join(__dirname, '../data/local.db'));

function calculateInitialSquads() {
  console.log('🔄 Calculating Initial Squads...');

  // 1. Load User Map (Name -> ID)
  const users = dbVal.prepare('SELECT id, name FROM users').all();
  const userMap = {}; // Name -> ID
  const userIdMap = {}; // ID -> Name
  users.forEach(u => {
    userMap[u.name] = u.id;
    userIdMap[u.id] = u.name;
  });
  // Add 'Mercado' and 'Biwenger' as specific non-user entities
  userMap['Mercado'] = -1;
  userMap['Biwenger'] = -2;

  // 2. Load Current Ownership (PlayerID -> OwnerID)
  const players = dbVal.prepare('SELECT id, owner_id, name FROM players').all();
  const ownership = {}; // PlayerID -> OwnerID
  // Also keep tracking of player names for logging
  const playerNames = {};

  players.forEach(p => {
    ownership[p.id] = p.owner_id; // Current owner
    playerNames[p.id] = p.name;
  });

  // 3. Load Transfers (Newest First)
  const transfers = dbVal.prepare(`
    SELECT player_id, vendedor, comprador, fecha 
    FROM fichajes 
    ORDER BY timestamp DESC
  `).all();

  console.log(`📊 Loaded ${transfers.length} transfers.`);

  // 4. Reverse Replay
  let processed = 0;
  transfers.forEach(t => {
    const playerId = t.player_id;
    
    // Resolve IDs
    const buyerId = userMap[t.comprador];
    const sellerId = userMap[t.vendedor];

    // Logic: Player moved Seller -> Buyer. 
    // So BEFORE this transfer, the owner was Seller.
    ownership[playerId] = sellerId;
    processed++;
  });

  // 5. Filter for Final "Initial" State and INSERT
  const insertStmt = dbVal.prepare(`
    INSERT OR IGNORE INTO initial_squads (user_id, player_id, price) VALUES (?, ?, 0)
  `);
  
  const insertHighRes = dbVal.transaction((squads) => {
    let count = 0;
    for (const [uid, players] of Object.entries(squads)) {
      for (const player of players) {
        insertStmt.run(uid, player.id);
        count++;
      }
    }
    return count;
  });

  const initialSquadsToInsert = {}; // UserID -> [{id, name}]

  for (const [pid, ownerId] of Object.entries(ownership)) {
    // Check if ownerId is a valid user
    if (ownerId && ownerId !== -1 && ownerId !== -2) {
       if (userIdMap[ownerId]) {
         if (!initialSquadsToInsert[ownerId]) initialSquadsToInsert[ownerId] = [];
         initialSquadsToInsert[ownerId].push({ id: pid, name: playerNames[pid] });
       }
    }
  }
  
  console.log('💾 Saving to database...');
  const inserted = insertHighRes(initialSquadsToInsert);
  console.log(`✅ Inserted ${inserted} initial squad records.`);

  // 6. Report
  console.log('\n🏁 Initial Squads (Saved to DB):');
  Object.entries(initialSquadsToInsert).forEach(([uid, players]) => {
     const userName = userIdMap[uid];
     console.log(`\n👤 ${userName} (${players.length} players):`);
     console.log(players.map(p => p.name).slice(0, 10).join(', ') + (players.length > 10 ? '...' : ''));
  });
}

calculateInitialSquads();
