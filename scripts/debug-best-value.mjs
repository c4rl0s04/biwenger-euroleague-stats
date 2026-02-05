/**
 * Debug Script: Best Value Calculation
 * 
 * Usage: node scripts/debug-best-value.mjs <transferId>
 * Example: node scripts/debug-best-value.mjs 139
 * 
 * This script shows:
 * 1. The transfer details (player, buyer, price, date)
 * 2. The sale details (if sold)
 * 3. All matches played during ownership with fantasy points
 * 4. Total points and points/M€ ratio
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugBestValue(transferId) {
  console.log('\n🔍 DEBUG: Best Value Calculation');
  console.log('━'.repeat(60));

  // 1. Get transfer details (including player's team_id)
  const purchaseQuery = `
    SELECT 
      f.id as transfer_id,
      f.player_id,
      p.name as player_name,
      p.team_id,
      t.name as team_name,
      f.comprador as buyer,
      f.precio as price,
      to_timestamp(f.timestamp) as purchase_date,
      f.timestamp as purchase_ts
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE f.id = $1
  `;
  
  const purchaseResult = await pool.query(purchaseQuery, [transferId]);
  
  if (purchaseResult.rows.length === 0) {
    console.log('❌ Transfer not found with ID:', transferId);
    return;
  }

  const purchase = purchaseResult.rows[0];
  console.log('\n📥 PURCHASE DETAILS:');
  console.log(`   Transfer ID: ${purchase.transfer_id}`);
  console.log(`   Player: ${purchase.player_name} (ID: ${purchase.player_id})`);
  console.log(`   Team: ${purchase.team_name} (ID: ${purchase.team_id})`);
  console.log(`   Buyer: ${purchase.buyer}`);
  console.log(`   Price: ${purchase.price.toLocaleString('es-ES')} €`);
  console.log(`   Date: ${purchase.purchase_date}`);

  // 2. Find next sale (if any)
  const saleQuery = `
    SELECT 
      f.id as sale_id,
      f.precio as sale_price,
      to_timestamp(f.timestamp) as sale_date,
      f.timestamp as sale_ts,
      f.comprador as sold_to
    FROM fichajes f
    WHERE f.player_id = $1 
      AND f.vendedor = $2
      AND f.timestamp > $3
    ORDER BY f.timestamp ASC
    LIMIT 1
  `;

  const saleResult = await pool.query(saleQuery, [
    purchase.player_id,
    purchase.buyer,
    purchase.purchase_ts
  ]);

  let saleTs = null;
  if (saleResult.rows.length > 0) {
    const sale = saleResult.rows[0];
    saleTs = sale.sale_ts;
    console.log('\n📤 SALE DETAILS:');
    console.log(`   Sale ID: ${sale.sale_id}`);
    console.log(`   Sold To: ${sale.sold_to}`);
    console.log(`   Sale Price: ${sale.sale_price.toLocaleString('es-ES')} €`);
    console.log(`   Date: ${sale.sale_date}`);
  } else {
    console.log('\n📤 SALE DETAILS: Player still owned (no sale found)');
  }

  // 3. Get all matches during ownership window - ONLY for the player's team
  const matchesQuery = `
    SELECT 
      m.round_name,
      m.date,
      prs.fantasy_points as points,
      t_home.name as home_team,
      t_away.name as away_team,
      m.home_score,
      m.away_score
    FROM player_round_stats prs
    JOIN matches m ON m.round_id = prs.round_id
      AND (m.home_id = $2 OR m.away_id = $2)  -- Only the match where the player's team played
    LEFT JOIN teams t_home ON m.home_id = t_home.id
    LEFT JOIN teams t_away ON m.away_id = t_away.id
    WHERE prs.player_id = $1
      AND m.date >= to_timestamp($3)
      ${saleTs ? 'AND m.date <= to_timestamp($4)' : ''}
    ORDER BY m.date ASC
  `;

  const matchParams = saleTs 
    ? [purchase.player_id, purchase.team_id, purchase.purchase_ts, saleTs]
    : [purchase.player_id, purchase.team_id, purchase.purchase_ts];

  const matchesResult = await pool.query(matchesQuery, matchParams);

  console.log('\n⚽ MATCHES DURING OWNERSHIP (Team: ' + purchase.team_name + '):');
  console.log('━'.repeat(60));

  if (matchesResult.rows.length === 0) {
    console.log('   No matches found in this time window.');
  } else {
    let totalPoints = 0;
    matchesResult.rows.forEach((match, idx) => {
      totalPoints += match.points || 0;
      const dateStr = new Date(match.date).toLocaleDateString('es-ES');
      console.log(`   ${idx + 1}. ${match.round_name} (${dateStr})`);
      console.log(`      ${match.home_team} ${match.home_score} - ${match.away_score} ${match.away_team}`);
      console.log(`      Fantasy Points: ${match.points || 0}`);
      console.log('');
    });

    console.log('━'.repeat(60));
    console.log(`📊 SUMMARY:`);
    console.log(`   Total Matches: ${matchesResult.rows.length}`);
    console.log(`   Total Points: ${totalPoints}`);
    console.log(`   Purchase Price: ${purchase.price.toLocaleString('es-ES')} €`);
    
    const pointsPerMillion = (totalPoints * 1000000) / purchase.price;
    console.log(`   Points per M€: ${pointsPerMillion.toFixed(1)}`);
  }

  console.log('\n');
  await pool.end();
}

// Run
const transferId = process.argv[2];
if (!transferId) {
  console.log('Usage: node scripts/debug-best-value.mjs <transferId>');
  console.log('Example: node scripts/debug-best-value.mjs 139');
  process.exit(1);
}

debugBestValue(parseInt(transferId)).catch(console.error);
