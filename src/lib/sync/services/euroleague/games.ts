import { checksumPayload } from '../../../api/euroleague/client';
import { euroleagueSeasonYear } from '../../../api/euroleague/normalization';
import { CONFIG } from '../../../config';
import { prepareOfficialGameMutations } from '../../../db/mutations/official/game-data';
import { prepareOfficialMappingMutations } from '../../../db/mutations/official/mappings';
import { SyncManager } from '../../manager';
import { reconcilePlayerMappings } from './mappings';

export async function runGame(
  manager: SyncManager,
  gameCode: number,
  roundId: number,
  _roundName: string,
  options: { force?: boolean; existingChecksum?: string | null } = {}
) {
  const seasonCode = CONFIG.EUROLEAGUE.SEASON_CODE;
  if (!seasonCode) throw new Error('EUROLEAGUE_SEASON_CODE is required.');
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const seasonYear = euroleagueSeasonYear(seasonCode, seasonId);
  const provider = manager.context.euroleague;
  const gameMutations = prepareOfficialGameMutations(manager.context.db as any, seasonId);
  const mappingMutations = prepareOfficialMappingMutations(manager.context.db as any, seasonId);

  manager.log(`📊 Syncing official game ${gameCode}...`);
  const [report, metadata, boxscore, playByPlay, shots] = await Promise.all([
    provider.getGameReport(seasonYear, gameCode),
    provider.getGameMetadata(seasonYear, gameCode),
    provider.getPlayerBoxScore(seasonYear, gameCode),
    provider.getPlayByPlay(seasonYear, gameCode),
    provider.getShots(seasonYear, gameCode),
  ]);

  // A future game can validly return 404/empty data. Keep its schedule row untouched.
  if (!report && !metadata && boxscore.length === 0) {
    manager.log(`   ⏭️ Game ${gameCode}: official details not available yet.`);
    return { status: 'not_available_yet' as const };
  }

  const mapping = await reconcilePlayerMappings(mappingMutations, boxscore);
  const finalized = Boolean(report?.isPlayed && !metadata?.isLive && boxscore.length > 0);
  const checksum = checksumPayload({ report, metadata, boxscore, playByPlay, shots });
  if (finalized && !options.force && options.existingChecksum === checksum) {
    manager.log(`   ✅ Game ${gameCode}: final checksum unchanged.`);
    return { status: 'unchanged' as const, finalized: true, checksum };
  }
  await gameMutations.persistGameData({
    gameCode,
    report,
    metadata,
    boxscore,
    playByPlay,
    shots,
    checksum,
    finalized,
  });
  await gameMutations.materializeRoundStats(roundId);

  manager.log(
    `   ✅ Game ${gameCode}: ${boxscore.length} boxscore rows, ${playByPlay.length} plays, ${shots.length} shots, ${mapping.issues.length} pending mappings.`
  );
  return {
    status: 'updated' as const,
    finalized,
    checksum,
    matched: mapping.mapped,
    unmatched: mapping.issues.length,
    forced: Boolean(options.force),
  };
}
