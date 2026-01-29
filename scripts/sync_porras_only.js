import 'dotenv/config';

import { db } from '../src/lib/db/client.js';
import { run as runPorras } from '../src/lib/sync/steps/13-porras.js';

async function main() {
  console.log('🏁 Starting Porras Sync ONLY...');

  // Mock Manager Context
  const mockManager = {
    context: { db },
    log: (msg) => console.log(msg),
    error: (msg) => console.error(msg),
  };

  try {
    const result = await runPorras(mockManager);
    console.log('\n✅ Result:', result);
  } catch (err) {
    console.error('\n❌ Failed:', err);
  } finally {
    process.exit(0);
  }
}

main();
