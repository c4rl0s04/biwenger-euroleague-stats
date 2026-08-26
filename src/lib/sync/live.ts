import * as dotenv from 'dotenv';
import * as path from 'path';
import { db } from '../db/client';
import { acquireAdvisoryLock } from './advisory-lock';
import { assertSyncSeasonWritable } from './season-guard';
import { run as runSyncLineups } from './services/biwenger/lineups.js';
import { runGame } from './services/euroleague/stats';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function runLiveSync(): Promise<number> {
  const season = await assertSyncSeasonWritable(db as any);
  const matches = (
    await db.query(
      `SELECT id,official_game_code,round_id,round_name,status,date
       FROM matches
       WHERE season_id=$1 AND official_game_code IS NOT NULL
         AND status <> 'finished'
         AND date BETWEEN NOW()-INTERVAL '5 hours' AND NOW()+INTERVAL '1 hour'
       ORDER BY date`,
      [season.seasonId]
    )
  ).rows;
  if (matches.length === 0) {
    console.log('😴 No potentially live official games.');
    return 0;
  }

  const players = (await db.query('SELECT id,name FROM players')).rows;
  const playersList = Object.fromEntries(players.map((player: any) => [player.id, player]));
  const checkedRounds = new Set<number>();
  const manager = {
    context: { db, seasonId: season.seasonId, playersList },
    log: (message: string) => console.log(message),
    error: (message: string) => console.error(message),
  } as any;

  for (let index = 0; index < matches.length; index += 2) {
    await Promise.all(
      matches.slice(index, index + 2).map(async (match: any) => {
        if (!checkedRounds.has(match.round_id)) {
          checkedRounds.add(match.round_id);
          const lineups = await db.query(
            'SELECT 1 FROM lineups WHERE season_id=$1 AND round_id=$2 LIMIT 1',
            [season.seasonId, match.round_id]
          );
          if ((lineups.rowCount ?? 0) === 0) {
            await runSyncLineups(
              manager,
              { id: match.round_id, name: match.round_name, status: 'active' },
              playersList
            );
          }
        }
        await runGame(manager, match.official_game_code, match.round_id, match.round_name);
      })
    );
  }
  console.log(`🏁 Live sync processed ${matches.length} official games.`);
  return 0;
}

async function main() {
  const lock = await acquireAdvisoryLock(db as any, 823745, 'live');
  if (!lock.acquired) {
    console.log('⏭️ Another live sync is already running.');
    return 0;
  }
  try {
    return await runLiveSync();
  } finally {
    await lock.release();
    if (typeof db.end === 'function') await db.end();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error('Live sync failed:', error);
    process.exit(1);
  });
