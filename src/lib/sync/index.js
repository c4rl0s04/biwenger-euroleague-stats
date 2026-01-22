import dotenv from 'dotenv';
import path from 'path';

// Load Env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

console.log('🔧 Environment loaded.');

async function syncData() {
  const { SyncManager } = await import('./manager.js');
  const { CONFIG } = await import('../config.js');

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

  const DB_PATH = CONFIG.DB.PATH;
  const manager = new SyncManager(DB_PATH);

  // Register Pipeline Steps (Fixed Order)
  // Parse CLI Args
  const args = process.argv.slice(2);
  const onlyStep = args.find((a) => a.startsWith('--step='))?.split('=')[1] || null;
  const isDaily = args.includes('--daily');

  if (isDaily) {
    console.log('📅 Daily Sync Mode Active: Skipping heavy steps (9-12).');
    manager.context.isDaily = true;
  }

  // Register Pipeline Steps
  const shouldRun = (num) => {
    if (onlyStep) return String(onlyStep) === String(num);
    if (isDaily) {
      // Daily mode: Skip steps 9 (Initial Squads), 10 (Logos), 11 (Images), 12 (Colors)
      // But Allow steps <= 8 AND Step 13 (Porras)
      if (num >= 9 && num <= 12) return false;
      return true;
    }
    return true;
  };

  if (shouldRun(1)) manager.addStep('Sync Players (Biwenger)', stepPlayers.run);
  if (shouldRun(2)) manager.addStep('Sync Master Data (Linking)', stepMaster.run);
  if (shouldRun(3)) manager.addStep('Sync Match Schedule', stepMatches.run);
  if (shouldRun(4)) manager.addStep('Sync Standings (Users)', stepStandings.run);
  if (shouldRun(5)) manager.addStep('Sync Player Stats', stepStats.run);
  if (shouldRun(6)) manager.addStep('Sync User Lineups', stepLineups.run);
  if (shouldRun(7)) manager.addStep('Sync Market (Transfers/Bids)', stepMarket.run);
  if (shouldRun(8)) manager.addStep('Sync Squads (Ownership)', stepSquads.run);
  if (shouldRun(9)) manager.addStep('Sync Initial Squads', stepInitial.run);

  // New Image Sync Steps
  const stepTeams = await import('./steps/10-team-logos.js'); // Step 10
  const stepImages = await import('./steps/11-official-images.js'); // Step 11

  if (shouldRun(10)) manager.addStep('Sync Team Logos', stepTeams.run);
  if (shouldRun(11)) manager.addStep('Sync Player Images', stepImages.run);

  // New User Color Step
  const stepColors = await import('./steps/12-user-colors.js'); // Step 12
  if (shouldRun(12)) manager.addStep('Sync User Colors', stepColors.run);

  // New Porras Step
  const stepPorras = await import('./steps/13-porras.js'); // Step 13
  if (shouldRun(13)) manager.addStep('Sync Porras', stepPorras.run);

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
