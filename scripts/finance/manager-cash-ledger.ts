#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import { createCliPool } from '../../src/lib/db/cli';

dotenv.config({ path: '.env.local' });
dotenv.config();

interface CliOptions {
  seasonId?: string;
  startDate: string;
  budget: number;
  managerFilter?: string;
  showAllDetails: boolean;
  jsonOutput: boolean;
  noColor: boolean;
}

interface InitialPlayer {
  playerId: number;
  name: string;
  price: number;
  priceDate: string;
}

interface TransferItem {
  id: number;
  timestamp: number;
  date: string;
  playerId: number;
  playerName: string;
  price: number;
  counterparty: string;
}

interface FinanceItem {
  roundId: number | null;
  date: string;
  type: string;
  amount: number;
  description: string;
}

interface CurrentPlayer {
  playerId: number;
  name: string;
  currentPrice: number;
  source: 'initial' | 'market';
  acquisitionPrice?: number;
}

interface ManagerFinanceLedger {
  userId: string;
  name: string;
  colorIndex: number;
  initialSquad: InitialPlayer[];
  initialSquadValue: number;
  initialCash: number;
  purchases: TransferItem[];
  totalPurchases: number;
  sales: TransferItem[];
  totalSales: number;
  bonuses: FinanceItem[];
  totalBonuses: number;
  currentCash: number;
  currentSquad: CurrentPlayer[];
  currentSquadValue: number;
  totalTeamValue: number;
  netProfit: number;
}

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    startDate: '2026-09-19',
    budget: 40_000_000,
    showAllDetails: false,
    jsonOutput: false,
    noColor: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--season=')) {
      options.seasonId = arg.slice(9).trim();
    } else if (arg.startsWith('--start-date=')) {
      options.startDate = arg.slice(13).trim();
    } else if (arg.startsWith('--budget=')) {
      options.budget = Number(arg.slice(9)) || 40_000_000;
    } else if (arg.startsWith('--manager=')) {
      options.managerFilter = arg.slice(10).trim();
    } else if (arg === '--all-details') {
      options.showAllDetails = true;
    } else if (arg === '--json') {
      options.jsonOutput = true;
    } else if (arg === '--no-color') {
      options.noColor = true;
    }
  }

  return options;
}

// Colors helper
function createStyler(noColor: boolean) {
  if (noColor || !process.stdout.isTTY) {
    return {
      bold: (s: string) => s,
      dim: (s: string) => s,
      green: (s: string) => s,
      red: (s: string) => s,
      yellow: (s: string) => s,
      cyan: (s: string) => s,
      magenta: (s: string) => s,
      white: (s: string) => s,
    };
  }
  return {
    bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
    dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
    green: (s: string) => `\x1b[32m${s}\x1b[0m`,
    red: (s: string) => `\x1b[31m${s}\x1b[0m`,
    yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
    cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
    magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
    white: (s: string) => `\x1b[37m${s}\x1b[0m`,
  };
}

function formatEuro(amount: number): string {
  const formatted = new Intl.NumberFormat('es-ES', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} €`;
}

function formatShortEuro(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2)}M €`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)}k €`;
  }
  return `${sign}${abs} €`;
}

async function resolveSeasonId(pool: any, requested?: string): Promise<string> {
  if (requested) return requested;
  const res = await pool.query(
    `SELECT id FROM seasons WHERE status = 'active' ORDER BY id DESC LIMIT 1`
  );
  if (res.rows[0]?.id) return res.rows[0].id;
  return '2026-27';
}

async function loadLedgerData(pool: any, seasonId: string, startDate: string, budget: number): Promise<ManagerFinanceLedger[]> {
  // 1. Fetch active users
  const usersRes = await pool.query(
    `SELECT us.user_id, us.name, us.color_index
     FROM user_seasons us
     WHERE us.season_id = $1 AND COALESCE(us.status, 'active') = 'active'
     ORDER BY us.name ASC`,
    [seasonId]
  );
  const users: Array<{ user_id: string; name: string; color_index: number }> = usersRes.rows;
  const userIdByName = new Map<string, string>(users.map((u) => [u.name, u.user_id]));

  // 2. Fetch Initial Squads with prices anchored to startDate (fallback closest on or after startDate)
  const initialSquadsRes = await pool.query(
    `SELECT 
       ins.user_id,
       ins.player_id,
       p.name as player_name,
       COALESCE(exact_mv.price, after_mv.price, before_mv.price, 0) as price,
       COALESCE(exact_mv.date::text, after_mv.date::text, before_mv.date::text, 'unknown') as price_date
     FROM initial_squads ins
     JOIN players p ON ins.player_id = p.id
     LEFT JOIN LATERAL (
       SELECT price, date
       FROM market_values mv
       WHERE mv.season_id = $1 AND mv.player_id = ins.player_id AND mv.date = $2::date
       LIMIT 1
     ) exact_mv ON true
     LEFT JOIN LATERAL (
       SELECT price, date
       FROM market_values mv
       WHERE mv.season_id = $1 AND mv.player_id = ins.player_id AND mv.date >= $2::date
       ORDER BY mv.date ASC
       LIMIT 1
     ) after_mv ON true
     LEFT JOIN LATERAL (
       SELECT price, date
       FROM market_values mv
       WHERE mv.season_id = $1 AND mv.player_id = ins.player_id AND mv.date <= $2::date
       ORDER BY mv.date DESC
       LIMIT 1
     ) before_mv ON true
     WHERE ins.season_id = $1
     ORDER BY ins.user_id, p.name ASC`,
    [seasonId, startDate]
  );

  const initialSquadByUser = new Map<string, InitialPlayer[]>();
  for (const row of initialSquadsRes.rows) {
    const list = initialSquadByUser.get(row.user_id) || [];
    list.push({
      playerId: Number(row.player_id),
      name: row.player_name,
      price: Number(row.price),
      priceDate: row.price_date,
    });
    initialSquadByUser.set(row.user_id, list);
  }

  // 3. Fetch all completed fichajes with player names
  const fichajesRes = await pool.query(
    `SELECT 
       f.id,
       f.timestamp,
       f.fecha,
       f.player_id,
       p.name as player_name,
       f.precio,
       f.vendedor,
       f.comprador
     FROM fichajes f
     LEFT JOIN players p ON f.player_id = p.id
     WHERE f.season_id = $1
     ORDER BY f.timestamp ASC, f.id ASC`,
    [seasonId]
  );

  const purchasesByUser = new Map<string, TransferItem[]>();
  const salesByUser = new Map<string, TransferItem[]>();

  for (const row of fichajesRes.rows) {
    const price = Number(row.precio);
    const buyerId = userIdByName.get(row.comprador);
    const sellerId = userIdByName.get(row.vendedor);

    if (buyerId && row.vendedor !== row.comprador) {
      const list = purchasesByUser.get(buyerId) || [];
      list.push({
        id: Number(row.id),
        timestamp: Number(row.timestamp),
        date: row.fecha,
        playerId: Number(row.player_id),
        playerName: row.player_name || `Player #${row.player_id}`,
        price,
        counterparty: row.vendedor,
      });
      purchasesByUser.set(buyerId, list);
    }

    if (sellerId && row.vendedor !== row.comprador) {
      const list = salesByUser.get(sellerId) || [];
      list.push({
        id: Number(row.id),
        timestamp: Number(row.timestamp),
        date: row.fecha,
        playerId: Number(row.player_id),
        playerName: row.player_name || `Player #${row.player_id}`,
        price,
        counterparty: row.comprador,
      });
      salesByUser.set(sellerId, list);
    }
  }

  // 4. Fetch distinct finances (bonuses)
  const financesRes = await pool.query(
    `SELECT DISTINCT
       user_id,
       round_id,
       date,
       type,
       amount,
       description
     FROM finances
     WHERE season_id = $1 AND user_id IS NOT NULL
     ORDER BY date ASC`,
    [seasonId]
  );

  const bonusesByUser = new Map<string, FinanceItem[]>();
  for (const row of financesRes.rows) {
    const list = bonusesByUser.get(row.user_id) || [];
    list.push({
      roundId: row.round_id ? Number(row.round_id) : null,
      date: row.date,
      type: row.type,
      amount: Number(row.amount),
      description: row.description || '',
    });
    bonusesByUser.set(row.user_id, list);
  }

  // 5. Fetch current roster & latest market values
  const currentRosterRes = await pool.query(
    `SELECT 
       ps.owner_id as user_id,
       ps.player_id,
       p.name as player_name,
       COALESCE(latest_mv.price, 0) as current_price
     FROM player_seasons ps
     JOIN players p ON ps.player_id = p.id
     LEFT JOIN LATERAL (
       SELECT price
       FROM market_values mv
       WHERE mv.season_id = $1 AND mv.player_id = ps.player_id
       ORDER BY mv.date DESC
       LIMIT 1
     ) latest_mv ON true
     WHERE ps.season_id = $1 AND ps.owner_id IS NOT NULL
     ORDER BY latest_mv.price DESC NULLS LAST`,
    [seasonId]
  );

  const currentRosterByUser = new Map<string, CurrentPlayer[]>();
  for (const row of currentRosterRes.rows) {
    const list = currentRosterByUser.get(row.user_id) || [];
    list.push({
      playerId: Number(row.player_id),
      name: row.player_name,
      currentPrice: Number(row.current_price),
      source: 'market', // updated below
    });
    currentRosterByUser.set(row.user_id, list);
  }

  // 6. Build complete ledger for each manager
  const result: ManagerFinanceLedger[] = [];

  for (const user of users) {
    const initialSquad = initialSquadByUser.get(user.user_id) || [];
    const initialSquadValue = initialSquad.reduce((sum, p) => sum + p.price, 0);
    const initialCash = budget - initialSquadValue;

    const purchases = purchasesByUser.get(user.user_id) || [];
    const totalPurchases = purchases.reduce((sum, tx) => sum + tx.price, 0);

    const sales = salesByUser.get(user.user_id) || [];
    const totalSales = sales.reduce((sum, tx) => sum + tx.price, 0);

    const bonuses = bonusesByUser.get(user.user_id) || [];
    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);

    const currentCash = initialCash + totalSales - totalPurchases + totalBonuses;

    const initialPlayerIds = new Set(initialSquad.map((p) => p.playerId));
    const currentSquad = (currentRosterByUser.get(user.user_id) || []).map((cp) => {
      const isInitial = initialPlayerIds.has(cp.playerId);
      return {
        ...cp,
        source: (isInitial ? 'initial' : 'market') as 'initial' | 'market',
      };
    });
    const currentSquadValue = currentSquad.reduce((sum, p) => sum + p.currentPrice, 0);
    const totalTeamValue = currentCash + currentSquadValue;
    const netProfit = totalTeamValue - budget;

    result.push({
      userId: user.user_id,
      name: user.name,
      colorIndex: user.color_index,
      initialSquad,
      initialSquadValue,
      initialCash,
      purchases,
      totalPurchases,
      sales,
      totalSales,
      bonuses,
      totalBonuses,
      currentCash,
      currentSquad,
      currentSquadValue,
      totalTeamValue,
      netProfit,
    });
  }

  // Sort by total net worth descending
  result.sort((a, b) => b.totalTeamValue - a.totalTeamValue);
  return result;
}

function printSummaryTable(ledgers: ManagerFinanceLedger[], options: CliOptions, c: ReturnType<typeof createStyler>) {
  console.log('\n' + c.bold(c.cyan('========================================================================================')));
  console.log(c.bold(c.cyan(` BIWENGER MANAGER FINANCIAL LEDGER | Season: ${options.seasonId} | Anchor: ${options.startDate}`)));
  console.log(c.bold(c.cyan('========================================================================================\n')));

  const col = {
    rank: 4,
    name: 20,
    initRoster: 11,
    initCash: 11,
    buys: 11,
    sales: 11,
    bonus: 9,
    cash: 13,
    roster: 8,
    squadVal: 12,
    netWorth: 13,
    pnl: 11,
  };

  const header = 
    '#'.padEnd(col.rank) +
    'Manager'.padEnd(col.name) +
    'Init Squad'.padStart(col.initRoster) +
    'Init Cash'.padStart(col.initCash) +
    'Buys (-)'.padStart(col.buys) +
    'Sales (+)'.padStart(col.sales) +
    'Bonus'.padStart(col.bonus) +
    'Liquid Cash'.padStart(col.cash) +
    'Roster'.padStart(col.roster) +
    'Squad Val'.padStart(col.squadVal) +
    'Net Worth'.padStart(col.netWorth) +
    'Profit/Loss'.padStart(col.pnl);

  console.log(c.bold(header));
  console.log(c.dim('-'.repeat(header.length)));

  ledgers.forEach((m, idx) => {
    const rankStr = `${idx + 1}.`.padEnd(col.rank);
    const nameStr = m.name.padEnd(col.name);
    const initRosterStr = formatShortEuro(m.initialSquadValue).padStart(col.initRoster);
    const initCashStr = formatShortEuro(m.initialCash).padStart(col.initCash);
    const buysStr = formatShortEuro(m.totalPurchases).padStart(col.buys);
    const salesStr = formatShortEuro(m.totalSales).padStart(col.sales);
    const bonusStr = formatShortEuro(m.totalBonuses).padStart(col.bonus);
    
    // Liquid cash (colored based on positive / negative)
    const rawCashStr = formatEuro(m.currentCash).padStart(col.cash);
    const cashStr = m.currentCash >= 0 ? c.green(c.bold(rawCashStr)) : c.red(c.bold(rawCashStr));

    const rosterCountStr = `${m.currentSquad.length}p`.padStart(col.roster);
    const squadValStr = formatShortEuro(m.currentSquadValue).padStart(col.squadVal);
    const netWorthStr = c.bold(formatShortEuro(m.totalTeamValue).padStart(col.netWorth));
    
    const pnlSign = m.netProfit >= 0 ? '+' : '';
    const rawPnl = `${pnlSign}${formatShortEuro(m.netProfit)}`.padStart(col.pnl);
    const pnlStr = m.netProfit >= 0 ? c.green(rawPnl) : c.red(rawPnl);

    console.log(
      `${rankStr}${c.bold(nameStr)}${initRosterStr}${initCashStr}${buysStr}${salesStr}${bonusStr}${cashStr}${rosterCountStr}${squadValStr}${netWorthStr}${pnlStr}`
    );
  });

  console.log(c.dim('-'.repeat(header.length)));
  console.log(c.dim(`* Initial Squad anchored to market values on ${options.startDate} (or closest available day).`));
  console.log(c.dim(`* Run with --manager="<name>" to see detailed itemized transaction history.\n`));
}

function printManagerDetails(m: ManagerFinanceLedger, c: ReturnType<typeof createStyler>) {
  console.log('\n' + c.bold(c.yellow(`========================================================================================`)));
  console.log(c.bold(c.yellow(` DETAILED AUDIT: ${m.name.toUpperCase()} (ID: ${m.userId})`)));
  console.log(c.bold(c.yellow(`========================================================================================\n`)));

  console.log(c.bold(`1. INITIAL SQUAD (Day 0 Baseline)`));
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  m.initialSquad.forEach((p, i) => {
    const num = `${i + 1}.`.padEnd(4);
    const pName = p.name.padEnd(28);
    const pPrice = formatEuro(p.price).padStart(14);
    const pDate = `(date: ${p.priceDate})`.padStart(20);
    console.log(`  ${num}${pName}${pPrice} ${c.dim(pDate)}`);
  });
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  console.log(`  ${'Total Squad Value:'.padEnd(32)} ${c.bold(formatEuro(m.initialSquadValue).padStart(14))}`);
  console.log(`  ${'Initial Liquid Cash (40M - Squad):'.padEnd(32)} ${c.bold(c.cyan(formatEuro(m.initialCash).padStart(14)))}\n`);

  console.log(c.bold(`2. SALES TO MARKET / MANAGERS (+ CASH)`));
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  if (m.sales.length === 0) {
    console.log(c.dim('  (No sales executed)'));
  } else {
    m.sales.forEach((s, i) => {
      const num = `${i + 1}.`.padEnd(4);
      const dateStr = s.date.slice(0, 10).padEnd(12);
      const pName = s.playerName.padEnd(26);
      const to = `to: ${s.counterparty}`.padEnd(20);
      const priceStr = c.green(`+${formatEuro(s.price)}`.padStart(16));
      console.log(`  ${num}${dateStr}${pName}${to}${priceStr}`);
    });
  }
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  console.log(`  ${'Total Cash from Sales:'.padEnd(62)} ${c.bold(c.green(`+${formatEuro(m.totalSales)}`.padStart(16)))}\n`);

  console.log(c.bold(`3. PURCHASES FROM MARKET / MANAGERS (- CASH)`));
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  if (m.purchases.length === 0) {
    console.log(c.dim('  (No purchases executed)'));
  } else {
    m.purchases.forEach((p, i) => {
      const num = `${i + 1}.`.padEnd(4);
      const dateStr = p.date.slice(0, 10).padEnd(12);
      const pName = p.playerName.padEnd(26);
      const from = `from: ${p.counterparty}`.padEnd(20);
      const priceStr = c.red(`-${formatEuro(p.price)}`.padStart(16));
      console.log(`  ${num}${dateStr}${pName}${from}${priceStr}`);
    });
  }
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  console.log(`  ${'Total Cash Spent on Buys:'.padEnd(62)} ${c.bold(c.red(`-${formatEuro(m.totalPurchases)}`.padStart(16)))}\n`);

  console.log(c.bold(`4. ROUND BONUSES & PRIZES (+ CASH)`));
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  if (m.bonuses.length === 0) {
    console.log(c.dim('  (No bonuses recorded)'));
  } else {
    m.bonuses.forEach((b, i) => {
      const num = `${i + 1}.`.padEnd(4);
      const dateStr = b.date.slice(0, 10).padEnd(12);
      const desc = (b.description || b.type).padEnd(46);
      const amountStr = c.green(`+${formatEuro(b.amount)}`.padStart(16));
      console.log(`  ${num}${dateStr}${desc}${amountStr}`);
    });
  }
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  console.log(`  ${'Total Bonuses Awarded:'.padEnd(62)} ${c.bold(c.green(`+${formatEuro(m.totalBonuses)}`.padStart(16)))}\n`);

  console.log(c.bold(`5. CURRENT CASH CALCULATION`));
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  console.log(`  ${'Initial Cash:'.padEnd(32)} ${formatEuro(m.initialCash).padStart(16)}`);
  console.log(`  ${'+ Total Sales:'.padEnd(32)} ${c.green(`+${formatEuro(m.totalSales)}`.padStart(16))}`);
  console.log(`  ${'- Total Purchases:'.padEnd(32)} ${c.red(`-${formatEuro(m.totalPurchases)}`.padStart(16))}`);
  console.log(`  ${'+ Total Bonuses:'.padEnd(32)} ${c.green(`+${formatEuro(m.totalBonuses)}`.padStart(16))}`);
  console.log(c.dim(`  ------------------------------------------------`));
  const cashColor = m.currentCash >= 0 ? c.green : c.red;
  console.log(`  ${c.bold('CURRENT LIQUID CASH:'.padEnd(32))} ${c.bold(cashColor(formatEuro(m.currentCash).padStart(16)))}\n`);

  console.log(c.bold(`6. CURRENT SQUAD (${m.currentSquad.length} Players)`));
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  m.currentSquad.forEach((p, i) => {
    const num = `${i + 1}.`.padEnd(4);
    const pName = p.name.padEnd(28);
    const src = `(${p.source})`.padEnd(12);
    const pPrice = formatEuro(p.currentPrice).padStart(14);
    console.log(`  ${num}${pName}${c.dim(src)}${pPrice}`);
  });
  console.log(c.dim(`----------------------------------------------------------------------------------------`));
  console.log(`  ${'Current Squad Market Value:'.padEnd(44)} ${c.bold(formatEuro(m.currentSquadValue).padStart(14))}`);
  console.log(`  ${'Total Net Worth (Cash + Squad):'.padEnd(44)} ${c.bold(c.cyan(formatEuro(m.totalTeamValue).padStart(14)))}`);
  const diffSign = m.netProfit >= 0 ? '+' : '';
  const diffColor = m.netProfit >= 0 ? c.green : c.red;
  console.log(`  ${'Net Profit vs 40M Base:'.padEnd(44)} ${c.bold(diffColor(`${diffSign}${formatEuro(m.netProfit)}`.padStart(14)))}\n`);
}

async function main() {
  const options = parseCliArgs();
  const c = createStyler(options.noColor);
  const pool = createCliPool();

  try {
    options.seasonId = await resolveSeasonId(pool, options.seasonId);
    const ledgers = await loadLedgerData(pool, options.seasonId, options.startDate, options.budget);

    if (options.jsonOutput) {
      console.log(JSON.stringify({ options, ledgers }, null, 2));
      return;
    }

    if (options.managerFilter) {
      const match = ledgers.find(
        (m) => m.name.toLowerCase().includes(options.managerFilter!.toLowerCase()) || m.userId === options.managerFilter
      );
      if (!match) {
        console.error(c.red(`Manager matching "${options.managerFilter}" not found in season ${options.seasonId}.`));
        console.log(`Available managers: ${ledgers.map((m) => m.name).join(', ')}`);
        process.exitCode = 1;
        return;
      }
      printSummaryTable(ledgers, options, c);
      printManagerDetails(match, c);
    } else if (options.showAllDetails) {
      printSummaryTable(ledgers, options, c);
      for (const m of ledgers) {
        printManagerDetails(m, c);
      }
    } else {
      printSummaryTable(ledgers, options, c);
    }
  } catch (err: any) {
    console.error(c.red(`\nError executing manager cash ledger: ${err.message}`));
    if (err.stack) console.error(c.dim(err.stack));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
