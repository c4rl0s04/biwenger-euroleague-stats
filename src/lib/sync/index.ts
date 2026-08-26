import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

interface SyncCliOptions {
  mode: 'routine' | 'bootstrap' | 'live';
  step?: string;
  forceGame?: number;
}

export function parseSyncArgs(args: string[]): SyncCliOptions {
  let mode: SyncCliOptions['mode'] = 'routine';
  let step: string | undefined;
  let forceGame: number | undefined;

  for (const argument of args) {
    if (argument.startsWith('--mode=')) {
      const value = argument.slice('--mode='.length);
      if (!['routine', 'bootstrap', 'live'].includes(value)) {
        throw new Error(`Invalid sync mode "${value}". Use routine, bootstrap or live.`);
      }
      mode = value as SyncCliOptions['mode'];
      continue;
    }
    if (argument.startsWith('--step=')) {
      step = argument.slice('--step='.length);
      if (!step) throw new Error('--step requires a descriptive step id.');
      continue;
    }
    if (argument.startsWith('--force-game=')) {
      forceGame = Number(argument.slice('--force-game='.length));
      if (!Number.isInteger(forceGame) || forceGame <= 0) {
        throw new Error('--force-game must be a positive integer.');
      }
      continue;
    }
    throw new Error(`Unknown sync argument: ${argument}`);
  }

  if (forceGame !== undefined && step !== 'euroleague-games') {
    throw new Error('--force-game requires --step=euroleague-games.');
  }
  return { mode, step, forceGame };
}

export async function syncData(args = process.argv.slice(2)): Promise<number> {
  const options = parseSyncArgs(args);
  const [{ CONFIG }, { SyncManager }, { selectPipeline }] = await Promise.all([
    import('../config'),
    import('./manager'),
    import('./pipeline'),
  ]);

  if (!process.env.BIWENGER_TOKEN && !CONFIG.API.TOKEN) {
    throw new Error('BIWENGER_TOKEN is required.');
  }

  const manager = new SyncManager({ mode: options.mode, forceGame: options.forceGame });
  for (const step of selectPipeline(options.mode, options.step)) manager.addStep(step);
  await manager.run();
  return manager.hasErrors ? 1 : 0;
}

if (process.env.NODE_ENV !== 'test') {
  syncData()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error('Synchronization failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
