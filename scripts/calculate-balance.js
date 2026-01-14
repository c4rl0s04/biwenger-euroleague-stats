/**
 * Calculate Balance Script - CORRECTED VERSION
 * 
 * Uses Sept 25, 2025 prices from market_values for initial squad cost.
 * 
 * Formula:
 *   Starting Balance = 40M - InitialSquadCost (prices from Sept 25)
 *   + Sales revenue (all fichajes where user is vendedor)
 *   - Purchase costs (all fichajes where user is comprador)
 *   + Round bonuses
 *   = Current Balance
 *   + Current Squad Value = Total Patrimony
 * 
 * Usage: node scripts/calculate-balance.js
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'data', 'local.db');
const STARTING_PATRIMONY = 40_000_000; // 40M€
const LEAGUE_START_DATE = '2025-09-25';

console.log('💰 Balance Calculator\n');
console.log('='.repeat(70));

const db = new Database(DB_PATH, { readonly: true });

// Get all users
const users = db.prepare('SELECT id, name FROM users ORDER BY name').all();

const results = [];

for (const user of users) {
  const userId = user.id.toString();
  
  // 1. Get initial squad cost using Sept 25 prices
  const initialSquad = db.prepare(`
    SELECT 
      isq.player_id, 
      p.name as player_name,
      COALESCE(
        (SELECT mv.price FROM market_values mv 
         WHERE mv.player_id = isq.player_id 
         AND mv.date = ?),
        p.price
      ) as initial_price
    FROM initial_squads isq
    JOIN players p ON isq.player_id = p.id
    WHERE isq.user_id = ?
  `).all(LEAGUE_START_DATE, userId);
  
  const initialSquadCost = initialSquad.reduce((sum, p) => sum + (p.initial_price || 0), 0);
  
  // 2. Get all purchases (money OUT)
  const purchases = db.prepare(`
    SELECT SUM(precio) as total
    FROM fichajes
    WHERE comprador = ?
  `).get(user.name);
  const totalPurchases = purchases?.total || 0;
  
  // 3. Get all sales (money IN)
  const sales = db.prepare(`
    SELECT SUM(precio) as total
    FROM fichajes
    WHERE vendedor = ?
  `).get(user.name);
  const totalSales = sales?.total || 0;
  
  // 4. Get all bonuses from finances
  const bonuses = db.prepare(`
    SELECT SUM(amount) as total
    FROM finances
    WHERE user_id LIKE ? AND type = 'round_bonus'
  `).get(userId + '%');
  const totalBonuses = bonuses?.total || 0;
  
  // 5. Get current squad value
  const currentSquad = db.prepare(`
    SELECT SUM(price) as total
    FROM players
    WHERE owner_id = ?
  `).get(user.id);
  const currentSquadValue = currentSquad?.total || 0;
  
  // Calculate balance
  const initialBalance = STARTING_PATRIMONY - initialSquadCost;
  const currentBalance = initialBalance - totalPurchases + totalSales + totalBonuses;
  const totalPatrimony = currentBalance + currentSquadValue;
  
  // Calculate value change
  const netInvestment = initialSquadCost + totalPurchases - totalSales;
  const playerValueChange = currentSquadValue - netInvestment;
  
  results.push({
    userId: user.id,
    name: user.name,
    initialSquadCost,
    initialBalance,
    totalPurchases,
    totalSales,
    totalBonuses,
    currentBalance,
    currentSquadValue,
    playerValueChange,
    totalPatrimony,
    initialSquadPlayers: initialSquad.length,
  });
}

// Sort by total patrimony (descending)
results.sort((a, b) => b.totalPatrimony - a.totalPatrimony);

const fmt = (n) => (n / 1_000_000).toFixed(2) + 'M€';

console.log(`\n📅 League Start Date: ${LEAGUE_START_DATE}`);
console.log(`💵 Starting Patrimony: ${fmt(STARTING_PATRIMONY)}\n`);

console.log('📊 User Balances:\n');
console.log('Rank | User                  | Balance    | Squad Value | Patrimony  | Δ Value');
console.log('-'.repeat(85));

results.forEach((r, i) => {
  const rank = (i + 1).toString().padStart(2);
  const name = r.name.substring(0, 20).padEnd(20);
  const balance = fmt(r.currentBalance).padStart(10);
  const squad = fmt(r.currentSquadValue).padStart(11);
  const patrimony = fmt(r.totalPatrimony).padStart(10);
  const valueChange = (r.playerValueChange >= 0 ? '+' : '') + fmt(r.playerValueChange);
  
  console.log(`  ${rank} | ${name} | ${balance} | ${squad} | ${patrimony} | ${valueChange}`);
});

console.log('\n' + '='.repeat(70));
console.log('\n📈 Detailed Breakdown:\n');

results.forEach((r) => {
  console.log(`\n${r.name} (${r.initialSquadPlayers} initial players)`);
  console.log('-'.repeat(50));
  console.log(`  Starting Patrimony:    ${fmt(STARTING_PATRIMONY)}`);
  console.log(`  - Initial Squad Cost:  ${fmt(r.initialSquadCost)}`);
  console.log(`  = Initial Balance:     ${fmt(r.initialBalance)}`);
  console.log(`  - Player Purchases:    ${fmt(r.totalPurchases)}`);
  console.log(`  + Player Sales:        ${fmt(r.totalSales)}`);
  console.log(`  + Round Bonuses:       ${fmt(r.totalBonuses)}`);
  console.log(`  = Current Balance:     ${fmt(r.currentBalance)}`);
  console.log(`  + Current Squad Value: ${fmt(r.currentSquadValue)}`);
  console.log(`  = Total Patrimony:     ${fmt(r.totalPatrimony)}`);
  console.log(`  📈 Player Value Δ:     ${(r.playerValueChange >= 0 ? '+' : '')}${fmt(r.playerValueChange)}`);
});

db.close();
console.log('\n✅ Done!');