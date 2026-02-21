import { fetchRoundGames } from '../../../api/biwenger-client';
import { fetchGameHeader, fetchSchedule } from '../../../api/euroleague-client';
import { prepareMatchMutations } from '../../../db/mutations/matches';
import { SyncManager } from '../../manager';

/**
 * Syncs matches (games) for a specific round using Biwenger API.
 * Uses fetchRoundGames to retrieve match schedule, scores, and status.
 *
 * @param manager
 * @param round - Round object (id, name, status)
 * @param playersList - Map of player IDs to player objects (unused explicitly but kept for signature consistency)
 */
export async function run(manager: SyncManager, round: any, playersList: any = {}) {
  const db = manager.context.db;
  const roundId = round.id;
  const dbRoundId = manager.resolveRoundId ? manager.resolveRoundId(round) : round.dbId || round.id;
  const roundName = round.name;

  manager.log(`   🌍 Syncing Matches for Round ${roundName} (using Biwenger API)...`);

  const mutations = prepareMatchMutations(db as any);

  // --- Euroleague Data Setup ---
  // Fetch team codes from DB
  const teams = await mutations.getMappedTeams();
  const teamCodeMap = new Map<number, string>(teams.map((t) => [t.id, t.code]));

  // Fetch Euroleague Schedule for Game Code mapping
  // Map Key: "HOMECODE_AWAYCODE" -> Value: GameCode
  const gameCodeMap = new Map<string, string>();
  try {
    const schedule = await fetchSchedule();
    if (schedule && schedule.schedule && schedule.schedule.item) {
      const items = Array.isArray(schedule.schedule.item)
        ? schedule.schedule.item
        : [schedule.schedule.item];
      for (const item of items) {
        if (item.homecode && item.awaycode && item.game) {
          // Keys are lowercase in the parsed XML result
          const codeA = item.homecode.trim();
          const codeB = item.awaycode.trim();
          gameCodeMap.set(`${codeA}_${codeB}`, item.game);
        }
      }
    }
  } catch (err: any) {
    manager.error(
      `   ⚠️ Failed to fetch EL schedule: ${err.message}. Regular time scores may be missing.`
    );
  }

  let gamesData: any;
  try {
    gamesData = await fetchRoundGames(roundId);
  } catch (e: any) {
    manager.error(`   ❌ Error fetching games for round ${roundId}: ${e.message}`);
    return { success: false, message: e.message, error: e };
  }

  let games: any[] = [];
  if (gamesData.data && Array.isArray(gamesData.data.games)) {
    games = gamesData.data.games;
  } else if (Array.isArray(gamesData.games)) {
    games = gamesData.games;
  } else {
    manager.error(`   ⚠️ No 'games' array found in response for round ${roundId}`);
    return { success: true, message: `No matches found for round ${roundName}`, data: [] };
  }

  if (games.length === 0) {
    manager.log(`   ⚠️ No games found for Round ${roundName}`);
    return { success: true, message: `No games`, data: [] };
  }

  manager.log(`   -> Found ${games.length} games.`);

  let syncedCount = 0;

  for (const game of games) {
    try {
      // Map Teams
      const homeTeam = game.home;
      const awayTeam = game.away;

      if (!homeTeam || !awayTeam) {
        manager.log(`      ⚠️ Missing team data for game ${game.id}`);
        continue;
      }

      // Safe IDs
      const homeId = homeTeam.id;
      const awayId = awayTeam.id;

      // Status Mapping
      let status = 'scheduled';
      if (game.status === 'finished') {
        status = 'finished';
      } else if (game.status === 'playing' || game.status === 'live') {
        status = 'live';
      }

      // Date Handling
      let matchDate = null;
      if (game.date) {
        matchDate = new Date(game.date * 1000).toISOString();
      }

      const homeScore = typeof homeTeam.score === 'number' ? homeTeam.score : 0;
      const awayScore = typeof awayTeam.score === 'number' ? awayTeam.score : 0;

      // Calculate regular time scores (excluding overtime)
      let homeScoreRegtime = null;
      let awayScoreRegtime = null;
      let homeQ1 = null,
        awayQ1 = null;
      let homeQ2 = null,
        awayQ2 = null;
      let homeQ3 = null,
        awayQ3 = null;
      let homeQ4 = null,
        awayQ4 = null;
      let homeOT = null,
        awayOT = null;

      // Determine if we should fetch Euroleague Data
      const now = Date.now();
      const gameTimeMs = game.date * 1000;
      const isPastStartTime = matchDate && now > gameTimeMs - 15 * 60 * 1000;

      const shouldFetchEuroleague =
        (status === 'finished' ||
          status === 'live' ||
          (status === 'scheduled' && isPastStartTime)) &&
        game.id;

      if (shouldFetchEuroleague) {
        try {
          // Map Biwenger team IDs to Euroleague codes
          const homeCode = teamCodeMap.get(homeId);
          const awayCode = teamCodeMap.get(awayId);

          if (homeCode && awayCode) {
            // Find game code using Home+Away combination
            const gameKey = `${homeCode}_${awayCode}`;
            const gameCodeObj = gameCodeMap.get(gameKey);

            if (gameCodeObj) {
              const header = await fetchGameHeader(gameCodeObj as any);

              if (header) {
                // Update Status from Euroleague (Source of Truth)
                if (header.Live) {
                  status = 'live';
                } else if (
                  status !== 'finished' &&
                  (parseInt(header.ScoreA) > 0 || parseInt(header.ScoreB) > 0)
                ) {
                  status = 'finished';
                }

                const getCumulative = (q: number, team: 'A' | 'B') => {
                  return parseInt(header[`ScoreQuarter${q}${team}`] ?? 0);
                };

                const hQ1_cum = getCumulative(1, 'A');
                const hQ2_cum = getCumulative(2, 'A');
                const hQ3_cum = getCumulative(3, 'A');
                const hQ4_cum = getCumulative(4, 'A');

                const aQ1_cum = getCumulative(1, 'B');
                const aQ2_cum = getCumulative(2, 'B');
                const aQ3_cum = getCumulative(3, 'B');
                const aQ4_cum = getCumulative(4, 'B');

                // Calculate points per quarter (Delta)
                homeQ1 = hQ1_cum;
                homeQ2 = hQ2_cum - hQ1_cum;
                homeQ3 = hQ3_cum - hQ2_cum;
                homeQ4 = hQ4_cum - hQ3_cum;

                // Sanity check for negative quarters (if data is messy during live)
                if (status === 'live') {
                  homeQ2 = Math.max(0, homeQ2);
                  homeQ3 = Math.max(0, homeQ3);
                  homeQ4 = Math.max(0, homeQ4);
                }

                awayQ1 = aQ1_cum;
                awayQ2 = aQ2_cum - aQ1_cum;
                awayQ3 = aQ3_cum - aQ2_cum;
                awayQ4 = aQ4_cum - aQ3_cum;

                // Regular time score is score at end of Q4
                homeScoreRegtime = hQ4_cum;
                awayScoreRegtime = aQ4_cum;

                // OT Score is Total - Regular
                const totalHome = parseInt(header.ScoreA ?? 0);
                const totalAway = parseInt(header.ScoreB ?? 0);

                if (status === 'live') {
                  homeScoreRegtime = totalHome;
                  awayScoreRegtime = totalAway;
                  homeOT = 0;
                  awayOT = 0;
                } else {
                  if (totalHome > homeScoreRegtime || totalAway > awayScoreRegtime) {
                    homeOT = totalHome - homeScoreRegtime;
                    awayOT = totalAway - awayScoreRegtime;
                  } else {
                    homeOT = 0;
                    awayOT = 0;
                  }
                }

                manager.log(
                  `      ✅ Found Euroleague data for ${homeCode} vs ${awayCode} (Game ${gameCodeObj}) [${status.toUpperCase()}]: ${totalHome}-${totalAway}`
                );
              }
            } else {
              manager.log(`      ⚠️  No Euroleague game found for ${homeCode} vs ${awayCode}`);
            }
          }
        } catch (e: any) {
          manager.error(`      Error fetching EL data: ${e.message}`);
        }
      }

      // If regular time scores not available, use final scores (fallback)
      if (homeScoreRegtime === null) {
        homeScoreRegtime = homeScore;
        awayScoreRegtime = awayScore;
      }

      await mutations.upsertMatch({
        round_id: dbRoundId,
        round_name: roundName,
        home_id: homeId,
        away_id: awayId,
        date: matchDate,
        status: status,
        home_score: homeScore,
        away_score: awayScore,
        home_score_regtime: homeScoreRegtime,
        away_score_regtime: awayScoreRegtime,
        home_q1: homeQ1,
        away_q1: awayQ1,
        home_q2: homeQ2,
        away_q2: awayQ2,
        home_q3: homeQ3,
        away_q3: awayQ3,
        home_q4: homeQ4,
        away_q4: awayQ4,
        home_ot: homeOT,
        away_ot: awayOT,
      });

      syncedCount++;
    } catch (e: any) {
      manager.error(`      Error syncing game ${game.id}: ${e.message}`);
    }
  }

  return { success: true, message: `Synced ${syncedCount} matches for ${roundName}.`, data: games };
}

// Legacy export
export const syncMatches = async (db: any, round: any, playersList: any) => {
  const mockManager = {
    context: { db },
    log: console.log,
    error: console.error,
  } as unknown as SyncManager;
  return run(mockManager, round, playersList);
};
