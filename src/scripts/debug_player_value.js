import 'dotenv/config';
import { db } from '../lib/db/client.js';

async function debugPlayerValue(playerId) {
  console.log(`\n🔍 Debugging Value Logic for Player ID: ${playerId}\n`);

  const query = `
    WITH RoundStarts AS (
      SELECT round_id, MIN(date) as start_date, MAX(date) as end_date
      FROM matches
      GROUP BY round_id
    )
    SELECT 
      f.id as transfer_id,
      f.timestamp as purchase_date_ts,
      to_timestamp(f.timestamp) as purchase_date,
      f.precio as purchase_price,
      f.comprador as owner_name,
      
      sale.timestamp as sale_date_ts,
      to_timestamp(sale.timestamp) as sale_date,
      
      m.id as match_id,
      m.date as match_date,
      rs.start_date as round_start_date,
      prs.fantasy_points,
      m.round_name,
      
      -- Diagnostics
      (to_timestamp(f.timestamp) < rs.start_date) as owned_before_round,
      (sale.timestamp IS NULL OR to_timestamp(sale.timestamp) > rs.start_date) as owned_during_round

    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    
    -- Find the next sale
    LEFT JOIN LATERAL (
        SELECT timestamp 
        FROM fichajes s
        WHERE s.player_id = f.player_id 
          AND s.vendedor = f.comprador
          AND s.timestamp > f.timestamp
        ORDER BY s.timestamp ASC
        LIMIT 1
    ) sale ON true

    -- Get all matches for this player
    JOIN player_round_stats prs ON prs.player_id = f.player_id
    JOIN RoundStarts rs ON rs.round_id = prs.round_id
    JOIN matches m ON m.round_id = prs.round_id AND (m.home_id = p.team_id OR m.away_id = p.team_id)

    WHERE f.player_id = $1
      AND f.comprador != 'Mercado'
      -- Only look at matches that "should" be relevant (roughly in the window)
      AND m.date >= to_timestamp(f.timestamp - 604800) -- Look back 1 week
      AND (sale.timestamp IS NULL OR m.date <= to_timestamp(sale.timestamp + 604800)) -- Look forward 1 week

    ORDER BY f.timestamp ASC, m.date ASC
  `;

  try {
    const result = await db.query(query, [playerId]);

    if (result.rows.length === 0) {
      console.log('No data found.');
      return;
    }

    let currentTransferId = null;
    let totalPoints = 0;

    result.rows.forEach((row) => {
      if (row.transfer_id !== currentTransferId) {
        if (currentTransferId !== null) {
          console.log(`   TOTAL POINTS For Period: ${totalPoints}\n`);
        }
        console.log(`--- Ownership: ${row.owner_name} ---`);
        console.log(`   Purchase: ${new Date(row.purchase_date).toLocaleString()}`);
        if (row.sale_date) console.log(`   Sale:     ${new Date(row.sale_date).toLocaleString()}`);
        else console.log(`   Sale:     Still Owned`);

        currentTransferId = row.transfer_id;
        totalPoints = 0;
      }

      const included = row.owned_before_round && row.owned_during_round;
      const icon = included ? '✅' : '❌';

      if (included) totalPoints += parseInt(row.fantasy_points);

      console.log(
        `   ${icon} Match: ${row.round_name} (${new Date(row.match_date).toLocaleDateString()}) | Pts: ${row.fantasy_points}`
      );
      if (!included) {
        console.log(`      Reason: Round Start ${new Date(row.round_start_date).toLocaleString()}`);
        if (!row.owned_before_round) console.log(`      -> Bought AFTER Round Start (Locked)`);
        if (!row.owned_during_round) console.log(`      -> Sold BEFORE Round Start`);
      }
    });
    console.log(`   TOTAL POINTS For Period: ${totalPoints}\n`);
  } catch (err) {
    console.error('Error executing debug query:', err);
  } finally {
    process.exit();
  }
}

const playerId = process.argv[2] || 24800;
debugPlayerValue(playerId);
