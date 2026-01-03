/**
 * Syncs initial squads by inferring ownership.
 * Logic: Initial Squad = (Players Sold by User + Players Currently Owned by User) - Players Bought by User
 * @param {import('better-sqlite3').Database} db - Database instance
 */

// League start date - when users joined and drafted their initial squads
const LEAGUE_START_DATE = '2025-09-25';

export async function syncInitialSquads(db) {
  console.log('\n📥 Syncing Initial Squads (Inferred)...');
  console.log(`   📅 Using league start date: ${LEAGUE_START_DATE}`);

  // 1. Get all users
  const users = db.prepare('SELECT id, name FROM users').all();
  if (users.length === 0) {
    console.log('No users found. Skipping.');
    return;
  }

  const insertInitial = db.prepare(`
      INSERT OR IGNORE INTO initial_squads (user_id, player_id, price) 
      VALUES (@user_id, @player_id, @price)
  `);

  // Query to get player's price on league start date (or closest date before it)
  const getInitialPrice = db.prepare(`
    SELECT price FROM market_values 
    WHERE player_id = ? AND date <= ?
    ORDER BY date DESC
    LIMIT 1
  `);

  let totalInferred = 0;

  for (const user of users) {
    // A. Get all players EVER sold by this user
    // If you sold it, you must have owned it.
    const soldPlayers = db
      .prepare(
        `
          SELECT DISTINCT player_id 
          FROM fichajes 
          WHERE vendedor = ? OR vendedor = ?
      `
      )
      .all(user.name, user.id)
      .map((r) => r.player_id);

    // B. Get players CURRENTLY owned by this user
    // If you own it now, you might have started with it.
    const currentPlayers = db
      .prepare(
        `
          SELECT id as player_id 
          FROM players 
          WHERE owner_id = ?
      `
      )
      .all(user.id)
      .map((r) => r.player_id);

    // Union of Sold + Current = All players ever interacting with this user as "Owner"
    const allOwned = new Set([...soldPlayers, ...currentPlayers]);

    // C. Get all players EVER bought by this user
    // If you bought it, it wasn't initial (unless you sold it and re-bought it, handled below)
    // Note: We need to be careful about re-buys.
    // Refined Logic:
    // A player is "Initial" if the *first* time it appears in your history, you are the Seller (or Current Owner w/ no history).
    // Let's look at the earliest event for each player for this user.

    const inferredInitial = [];

    for (const playerId of allOwned) {
      // Get chronological events for this player involving this user
      // Events: 'buy' (user is buyer), 'sell' (user is seller)
      // We order by timestamp ASC.

      // Fichajes involving user as Buyer
      const buys = db
        .prepare(
          `
              SELECT timestamp, 'buy' as type
              FROM fichajes
              WHERE player_id = ? AND (comprador = ? OR comprador = ?)
              ORDER BY timestamp ASC
          `
        )
        .all(playerId, user.name, user.id);

      // Fichajes involving user as Seller
      const sells = db
        .prepare(
          `
              SELECT timestamp, 'sell' as type
              FROM fichajes
              WHERE player_id = ? AND (vendedor = ? OR vendedor = ?)
              ORDER BY timestamp ASC
          `
        )
        .all(playerId, user.name, user.id);

      // Combine and Sort by time
      const events = [...buys, ...sells].sort((a, b) => a.timestamp - b.timestamp);

      if (events.length === 0) {
        // No transfer history, but currently owned (from 'currentPlayers').
        // Must be initial.
        inferredInitial.push(playerId);
      } else {
        // Has history. Look at the FIRST event.
        const firstEvent = events[0];

        if (firstEvent.type === 'sell') {
          // First thing you did was SELL it -> You started with it.
          inferredInitial.push(playerId);
        }
        // If first event is 'buy', you bought it -> Not initial.
      }
    }

    // Insert inferred players with their initial price
    const transaction = db.transaction(() => {
      for (const pid of inferredInitial) {
        // Look up price on league start date
        const priceRow = getInitialPrice.get(pid, LEAGUE_START_DATE);
        const initialPrice = priceRow ? priceRow.price : null;

        insertInitial.run({
          user_id: user.id,
          player_id: pid,
          price: initialPrice,
        });
      }
    });
    transaction();

    totalInferred += inferredInitial.length;
    // console.log(`   -> User ${user.name}: Inferred ${inferredInitial.length} initial players.`);
  }

  console.log(`✅ Initial Squads synced (${totalInferred} assignments).`);
}
