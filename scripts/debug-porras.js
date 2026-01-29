const { getPorrasStats } = require('../src/lib/db/queries/predictions.js');

// Mock db client if needed, but since we are running in node, we might need to setup the environment.
// However, the project seems to use standard pg or similar.
// Let's try to run it via the nextjs environment or just assume I can require it if I set up the module resolution.
// Actually, it's safer to use a temporary script in the project root that imports from lib.

async function run() {
  try {
    console.log('Fetching Porras Stats...');
    const data = await getPorrasStats();
    console.log('--- Porras Stats Output ---');
    console.log('Victories:', JSON.stringify(data.porra_stats.victorias, null, 2));
    console.log('Achievements:', JSON.stringify(data.achievements, null, 2));
    console.log('Clutch:', JSON.stringify(data.clutch_stats.slice(0, 2), null, 2)); // Just first 2
    console.log('Participation:', data.participation.length);
  } catch (error) {
    console.error('Error running debug script:', error);
  }
}

// We need to handle ES modules vs CommonJS. The project uses ES modules (import/export).
// So I should write this as an ES module script.
run();
