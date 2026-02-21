import {
  fetchBoxScore,
  fetchGameHeader,
  parseBoxScoreStats,
  normalizePlayerName,
} from '../../../api/euroleague-client';
import { CONFIG } from '../../../config';
import { prepareEuroleagueMutations } from '../../../db/mutations/euroleague';
import { SyncManager } from '../../manager';

const CURRENT_SEASON = CONFIG.EUROLEAGUE.SEASON_CODE;

/**
 * Syncs game stats from Euroleague official API.
 * This replaces the old Biwenger stats sync for more accurate data.
 *
 * @param manager
 * @param gameCode - Euroleague game code (1, 2, 3...)
 * @param roundId - Round ID for our database
 * @param roundName - Round name
 * @param options - { activeOnly: boolean }
 */
export async function runGame(
  manager: SyncManager,
  gameCode: number,
  roundId: number,
  roundName: string,
  options: any = {}
) {
  const db = manager.context.db;
  manager.log(`📊 Syncing Euroleague game ${gameCode} for round ${roundId}...`);

  // Initialize Mutations
  const mutations = prepareEuroleagueMutations(db as any);

  try {
    // 1. Fetch game header to check if game exists and is finished
    const header = await fetchGameHeader(gameCode, CURRENT_SEASON);

    if (!header || !header.TeamA) {
      manager.log(`   ⚠️ Game ${gameCode} has no data yet`);
      return { success: false, reason: 'no_data' };
    }

    // 3. Fetch box score with player stats
    const boxscore = await fetchBoxScore(gameCode, CURRENT_SEASON);

    // Handle future games with no stats yet
    if (!boxscore) {
      manager.log(`   ⏭️ Game ${gameCode} has no box score yet (future game)`);
      return { success: true, reason: 'no_boxscore_yet' };
    }

    const playerStats = parseBoxScoreStats(boxscore);

    if (playerStats.length === 0) {
      manager.log(`   ⚠️ No player stats for game ${gameCode}`);
      return { success: false, reason: 'no_stats' };
    }

    // 4. Get player ID mapping (euroleague_code -> biwenger id)
    // Also prepare fallback: find by name similarity
    const allPlayers = await mutations.getAllPlayers();

    // Build normalized name lookup
    const playerNameMap = new Map();
    for (const p of allPlayers) {
      const normalized = normalizePlayerName(p.name);
      playerNameMap.set(normalized, p);
    }

    // Prepare update statements - Using mutations module now

    let matched = 0;
    let unmatched = 0;

    for (const stat of playerStats) {
      let playerId = null;

      // Try to find by euroleague_code first
      const existing = await mutations.getPlayerByEuroleagueCode(stat.euroleague_code);
      if (existing) {
        playerId = existing.id;
      } else {
        // Fallback: find by normalized name
        const normalizedName = normalizePlayerName(stat.name);
        const matchedPlayer = playerNameMap.get(normalizedName);

        if (matchedPlayer) {
          playerId = matchedPlayer.id;
          // Save the mapping for future lookups
          await mutations.updatePlayerEuroleagueCode({
            euroleague_code: stat.euroleague_code,
            id: playerId,
          });
        }
      }

      if (!playerId) {
        unmatched++;
        continue;
      }

      matched++;

      // Insert stats (fantasy_points will be 0, updated later from Biwenger)
      await mutations.insertPlayerStats({
        player_id: playerId,
        round_id: roundId,
        fantasy_points: 0, // Will be updated from Biwenger
        minutes: stat.minutes,
        points: stat.points,
        two_points_made: stat.two_points_made,
        two_points_attempted: stat.two_points_attempted,
        three_points_made: stat.three_points_made,
        three_points_attempted: stat.three_points_attempted,
        free_throws_made: stat.free_throws_made,
        free_throws_attempted: stat.free_throws_attempted,
        rebounds: stat.rebounds,
        assists: stat.assists,
        steals: stat.steals,
        blocks: stat.blocks,
        turnovers: stat.turnovers,
        fouls_committed: stat.fouls_committed,
        valuation: stat.valuation,
        is_mvp: 0,
      });
    }

    manager.log(`   ✅ Game ${gameCode}: ${matched} players matched, ${unmatched} unmatched`);
    return { success: true, matched, unmatched };
  } catch (error: any) {
    manager.error(`   ❌ Error syncing game ${gameCode}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Legacy export
export const syncEuroleagueGameStats = async (
  db: any,
  gameCode: number,
  roundId: number,
  roundName: string,
  options: any
) => {
  const mockManager = {
    context: { db },
    log: console.log,
    error: console.error,
  } as unknown as SyncManager;
  return runGame(mockManager, gameCode, roundId, roundName, options);
};

/**
 * Sync fantasy points from Biwenger (to be called after Euroleague stats sync)
 * Updates the fantasy_points column for player_round_stats
 * @param manager
 * @param round
 * @param playersListInput
 */
export async function runBiwengerPoints(manager: SyncManager, round: any, playersListInput?: any) {
  const db = manager.context.db;
  const playersList = playersListInput || manager.context.playersList || {};

  // Import dynamically to avoid circular dependencies
  const { fetchRoundGames } = await import('../../../api/biwenger-client');

  const mutations = prepareEuroleagueMutations(db as any);

  const roundId = round.id;
  const dbRoundId = round.dbId || round.id;

  manager.log(`💫 Syncing Biwenger fantasy points for round ${roundId}...`);

  try {
    const gamesData = await fetchRoundGames(roundId);

    if (!gamesData?.data?.games) {
      manager.log('   ⚠️ No games data from Biwenger');
      return { success: false, message: 'No games data' };
    }

    let updated = 0;

    for (const game of gamesData.data.games) {
      const processReports = async (reports: any) => {
        if (!reports) return;
        for (const [, report] of Object.entries(reports) as any) {
          const playerId = report.player?.id;
          if (!playerId) continue;

          await mutations.updateFantasyPoints({
            fantasy_points: report.points || 0,
            player_id: playerId,
            round_id: dbRoundId,
          });

          updated++;
        }
      };

      await processReports(game.home.reports);
      await processReports(game.away.reports);
    }

    manager.log(`   ✅ Updated fantasy points for ${updated} players`);
    return { success: true, updated };
  } catch (error: any) {
    manager.error(`   ❌ Error syncing fantasy points:`, error.message);
    return { success: false, error: error.message };
  }
}

export const syncBiwengerFantasyPoints = async (db: any, round: any, playersList: any) => {
  const mockManager = {
    context: { db, playersList: playersList || {} },
    log: console.log,
    error: console.error,
  } as unknown as SyncManager;
  return runBiwengerPoints(mockManager, round, playersList);
};
