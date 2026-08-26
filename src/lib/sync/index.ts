import * as dotenv from 'dotenv';
import * as path from 'path';

// Load Env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

console.log('🔧 Environment loaded.');

async function syncData() {
  const { SyncManager } = await import('./manager');
  const { CONFIG } = await import('../config');

  // Steps
  const stepPlayers = await import('./steps/01-players.js'); // Step 1
  const stepMaster = await import('./steps/02-master-data.js'); // Step 2
  const stepMatches = await import('./steps/03-matches.js'); // Step 3
  const stepStandings = await import('./steps/04-standings.js'); // Step 4
  const stepStats = await import('./steps/05-stats.js'); // Step 5
  const stepLineups = await import('./steps/06-lineups.js'); // Step 6
  const stepMarket = await import('./steps/07-market.js'); // Step 7
  const stepSquads = await import('./steps/08-squads.js'); // Step 8
  const stepInitial = await import('./steps/09-initial-squads.js'); // Step 9

  // Validate environment
  if (!process.env.BIWENGER_TOKEN && !CONFIG.API.TOKEN) {
    console.error('❌ ERROR: BIWENGER_TOKEN is required!');
    process.exit(1);
  }

  // Register Pipeline Steps (Fixed Order)
  // Parse CLI Args
  const args = process.argv.slice(2);
  const onlyStep = args.find((a) => a.startsWith('--step='))?.split('=')[1] || null;
  const isDaily = args.includes('--daily');
  const continueOnError =
    args.includes('--continue-on-error') || process.env.SYNC_CONTINUE_ON_ERROR === 'true';
  const mode = isDaily ? 'daily' : 'full';

  const DB_PATH = CONFIG.DB.PATH;
  const manager = new SyncManager(DB_PATH, { mode, continueOnError });

  if (isDaily) {
    console.log('📅 Daily Sync Mode Active: Skipping heavy steps (9-12).');
    manager.context.isDaily = true;
  }

  // Register Pipeline Steps
  const shouldRun = (num: number) => {
    if (onlyStep) return String(onlyStep) === String(num);

    // Steps 10/11 were retired: official logos and player images are now imported in Step 2.
    if (num === 10 || num === 11) return false;

    if (isDaily) {
      // Daily mode: Skip steps 9 (Initial Squads), 10 (Logos), 11 (Images), 12 (Colors)
      // But Allow steps <= 8 AND Step 13 (Porras)
      if (num >= 9 && num <= 12) return false;
      return true;
    }
    return true;
  };

  if (shouldRun(1)) manager.addStep('Sync Players (Biwenger)', stepPlayers.run, { number: 1 });
  if (shouldRun(2))
    manager.addStep('Sync Master Data (Linking)', stepMaster.run, { number: 2, dependencies: [1] });
  if (shouldRun(3))
    manager.addStep('Sync Match Schedule', stepMatches.run, { number: 3, dependencies: [1, 2] });
  if (shouldRun(4))
    manager.addStep('Sync Standings (Users)', stepStandings.run, { number: 4, dependencies: [1] });
  if (shouldRun(5))
    manager.addStep('Sync Player Stats', stepStats.run, { number: 5, dependencies: [1, 2, 3] });
  if (shouldRun(6))
    manager.addStep('Sync User Lineups', stepLineups.run, { number: 6, dependencies: [1, 4, 5] });
  if (shouldRun(7))
    manager.addStep('Sync Market (Transfers/Bids)', stepMarket.run, {
      number: 7,
      dependencies: [1],
    });
  if (shouldRun(8))
    manager.addStep('Sync Squads (Ownership)', stepSquads.run, { number: 8, dependencies: [1, 4] });
  if (shouldRun(9))
    manager.addStep('Sync Initial Squads', stepInitial.run, { number: 9, dependencies: [1, 8] });

  // New User Color Step
  const stepColors = await import('./steps/12-user-colors.js'); // Step 12
  if (shouldRun(12))
    manager.addStep('Sync User Colors', stepColors.run, { number: 12, critical: false });

  // New Porras Step
  const stepPorras = await import('./steps/13-porras.js'); // Step 13
  if (shouldRun(13))
    manager.addStep('Sync Porras', stepPorras.run, { number: 13, dependencies: [4] });

  // New Tournaments Step
  const stepTournaments = await import('./steps/14-tournaments.js'); // Step 14
  if (shouldRun(14))
    manager.addStep('Sync Tournaments', stepTournaments.run, { number: 14, dependencies: [4] });

  // Market Listings Snapshot Step
  const stepMarketListings = await import('./steps/15-market-listings.js'); // Step 15
  if (shouldRun(15))
    manager.addStep('Sync Market Listings', stepMarketListings.run, {
      number: 15,
      dependencies: [1, 7, 8],
    });

  // Execute
  await manager.run();

  if (manager.hasErrors) {
    console.error('\n❌ Sync process failed with errors.');
    process.exit(1);
  } else {
    console.log('\n✅ Sync process completed successfully.');
    process.exit(0);
  }
}

syncData();
