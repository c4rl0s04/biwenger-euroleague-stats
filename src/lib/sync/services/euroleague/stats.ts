import { getOfficialBasketballProvider } from '../../../api/official-provider-factory';
import { officialSeasonYear } from '../../../api/official-provider';
import { checksumPayload } from '../../../api/euroleague-advanced-client';
import { CONFIG } from '../../../config';
import { prepareEuroleagueMutations } from '../../../db/mutations/euroleague';
import { prepareOfficialMutations } from '../../../db/mutations/official';
import { SyncManager } from '../../manager';
import { reconcilePlayerMappings } from '../official/mapping';

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
  const seasonYear = officialSeasonYear(seasonCode, seasonId);
  const provider = await getOfficialBasketballProvider();
  const mutations = prepareOfficialMutations(manager.context.db as any, seasonId);

  manager.log(`📊 Syncing official game ${gameCode}...`);
  try {
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
      return { success: true, reason: 'not_available_yet' };
    }

    const mapping = await reconcilePlayerMappings(mutations, boxscore);
    const finalized = Boolean(report?.isPlayed && !metadata?.isLive && boxscore.length > 0);
    const checksum = checksumPayload({ report, metadata, boxscore, playByPlay, shots });
    if (finalized && !options.force && options.existingChecksum === checksum) {
      manager.log(`   ✅ Game ${gameCode}: final checksum unchanged.`);
      return { success: true, finalized: true, checksum, unchanged: true };
    }
    await mutations.persistGameData({
      gameCode,
      report,
      metadata,
      boxscore,
      playByPlay,
      shots,
      checksum,
      finalized,
    });
    await mutations.materializeRoundStats(roundId);

    manager.log(
      `   ✅ Game ${gameCode}: ${boxscore.length} boxscore rows, ${playByPlay.length} plays, ${shots.length} shots, ${mapping.issues.length} pending mappings.`
    );
    return {
      success: true,
      finalized,
      checksum,
      matched: mapping.mapped,
      unmatched: mapping.issues.length,
      forced: Boolean(options.force),
    };
  } catch (error: any) {
    manager.error(`   ❌ Error syncing official game ${gameCode}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export const syncEuroleagueGameStats = async (
  db: any,
  gameCode: number,
  roundId: number,
  roundName: string,
  options: any
) => {
  const mockManager = {
    context: { db, seasonId: process.env.SEASON_ID || '2026-27' },
    log: console.log,
    error: console.error,
  } as unknown as SyncManager;
  return runGame(mockManager, gameCode, roundId, roundName, options);
};

/** Biwenger remains authoritative for fantasy points only. */
export async function runBiwengerPoints(manager: SyncManager, round: any, playersListInput?: any) {
  const playersList = playersListInput || manager.context.playersList || {};
  void playersList;
  const { fetchRoundGames } = await import('../../../api/biwenger-client');
  const mutations = prepareEuroleagueMutations(manager.context.db as any, {
    seasonId: manager.context.seasonId,
  });
  const dbRoundId = round.dbId || round.id;

  try {
    const gamesData = await fetchRoundGames(round.id);
    const games = gamesData?.data?.games || gamesData?.games;
    if (!games) return { success: false, message: 'No Biwenger games data' };
    let updated = 0;
    for (const game of games) {
      for (const reports of [game.home?.reports, game.away?.reports]) {
        if (!reports) continue;
        for (const report of Object.values(reports) as any[]) {
          const playerId = report.player?.id;
          if (!playerId) continue;
          await mutations.updateFantasyPoints({
            fantasy_points: report.points || 0,
            player_id: playerId,
            round_id: dbRoundId,
          });
          updated++;
        }
      }
    }
    manager.log(`   ✅ Applied ${updated} authoritative Biwenger fantasy scores.`);
    return { success: true, updated };
  } catch (error: any) {
    manager.error(`   ❌ Error syncing fantasy points: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export const syncBiwengerFantasyPoints = async (db: any, round: any, playersList: any) => {
  const mockManager = {
    context: { db, playersList: playersList || {}, seasonId: process.env.SEASON_ID || '2026-27' },
    log: console.log,
    error: console.error,
  } as unknown as SyncManager;
  return runBiwengerPoints(mockManager, round, playersList);
};
