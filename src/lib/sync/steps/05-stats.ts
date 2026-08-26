import { prepareOfficialMutations } from '../../db/mutations/official';
import { SyncManager } from '../manager';
import * as officialStats from '../services/euroleague/stats';
import { getOfficialBasketballProvider } from '../../api/official-provider-factory';

async function mapWithConcurrency<T>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<void>
) {
  let next = 0;
  const runners = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (next < values.length) {
      const index = next++;
      await worker(values[index]);
    }
  });
  await Promise.all(runners);
}

function validRound(round: any) {
  return /Jornada|Playoff|Final Four|Eliminatoria|Play-In/i.test(round.name || '');
}

export async function run(manager: SyncManager) {
  manager.log('\n📊 Step 5: Syncing official game data and Biwenger fantasy points...');
  const db = manager.context.db as any;
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const forceArg = process.argv.find((arg) => arg.startsWith('--force-game='));
  const forceGame = forceArg ? Number(forceArg.split('=')[1]) : undefined;
  if (forceArg && !Number.isInteger(forceGame)) throw new Error('--force-game must be an integer.');

  const mutations = prepareOfficialMutations(db, seasonId);
  const candidates = await mutations.getSyncCandidates(forceGame);
  let failures = 0;
  await mapWithConcurrency(candidates, 2, async (game) => {
    const result = await officialStats.runGame(
      manager,
      game.game_code,
      game.round_id,
      game.round_name,
      {
        force: forceGame === game.game_code,
        existingChecksum: game.payload_checksum,
      }
    );
    if (!result.success) failures++;
  });

  const competition: any = manager.context.competition;
  let rounds =
    competition?.data?.rounds ||
    competition?.data?.season?.rounds ||
    competition?.data?.data?.season?.rounds ||
    competition?.rounds;
  if (!rounds) {
    const { fetchCompetition } = await import('../../api/biwenger-client');
    const fetched = await fetchCompetition();
    rounds =
      fetched?.data?.rounds ||
      fetched?.data?.season?.rounds ||
      fetched?.data?.data?.season?.rounds ||
      fetched?.rounds ||
      [];
  }

  for (const round of rounds.filter(validRound)) {
    const dbId = manager.resolveRoundId(round);
    const matchWindow = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM matches
       WHERE season_id=$1 AND round_id=$2
         AND (date < NOW()+INTERVAL '1 hour' OR status IN ('live','finished'))`,
      [seasonId, dbId]
    );
    if (!forceGame && manager.context.isDaily && matchWindow.rows[0]?.count === 0) continue;
    await officialStats.runBiwengerPoints(manager, { ...round, dbId }, manager.context.playersList);
  }

  const metrics = (await getOfficialBasketballProvider()).getMetrics();
  const lastSuccessfulAgeSeconds = metrics.lastSuccessfulAt
    ? Math.round((Date.now() - Date.parse(metrics.lastSuccessfulAt)) / 1000)
    : null;
  manager.log(
    `   📡 Official provider metrics: ${JSON.stringify({ ...metrics, lastSuccessfulAgeSeconds })}`
  );

  return {
    success: failures === 0,
    message: `Processed ${candidates.length} official games (${failures} failures).`,
  };
}
