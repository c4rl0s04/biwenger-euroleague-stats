import { fetchRoundGames } from '../../../api/biwenger-client';
import { prepareMatchMutations } from '../../../db/mutations/matches';
import { SyncManager } from '../../manager';

interface OfficialMatchRow {
  game_code: number;
  round_number: number | null;
  scheduled_at: Date | null;
  status: string;
  home_team_code: string;
  away_team_code: string;
  home_score: number | null;
  away_score: number | null;
  home_score_regtime: number | null;
  away_score_regtime: number | null;
  home_q1: number | null;
  away_q1: number | null;
  home_q2: number | null;
  away_q2: number | null;
  home_q3: number | null;
  away_q3: number | null;
  home_q4: number | null;
  away_q4: number | null;
  home_ot: number | null;
  away_ot: number | null;
}

function roundNumber(name: string): number | null {
  const match = /(?:Jornada|Round)\s+(\d+)/i.exec(name);
  return match ? Number(match[1]) : null;
}

function closestOfficialGame(
  candidates: OfficialMatchRow[],
  expectedRound: number | null,
  biwengerDate: number | null
): OfficialMatchRow | null {
  if (candidates.length === 0) return null;
  const ranked = [...candidates].sort((left, right) => {
    const leftRoundPenalty = expectedRound != null && left.round_number !== expectedRound ? 1 : 0;
    const rightRoundPenalty = expectedRound != null && right.round_number !== expectedRound ? 1 : 0;
    if (leftRoundPenalty !== rightRoundPenalty) return leftRoundPenalty - rightRoundPenalty;
    if (!biwengerDate) return left.game_code - right.game_code;
    const expected = biwengerDate * 1000;
    const leftDistance = left.scheduled_at
      ? Math.abs(new Date(left.scheduled_at).getTime() - expected)
      : Number.MAX_SAFE_INTEGER;
    const rightDistance = right.scheduled_at
      ? Math.abs(new Date(right.scheduled_at).getTime() - expected)
      : Number.MAX_SAFE_INTEGER;
    return leftDistance - rightDistance;
  });
  return ranked[0];
}

/**
 * Biwenger supplies fantasy round/team identities only. Every sporting field written to
 * matches comes from official_games.
 */
export async function run(manager: SyncManager, round: any, _playersList: any = {}) {
  const db = manager.context.db as any;
  const seasonId = manager.context.seasonId;
  const dbRoundId = manager.resolveRoundId ? manager.resolveRoundId(round) : round.dbId || round.id;
  const mutations = prepareMatchMutations(db, { seasonId });

  let gamesData: any;
  let mappingResult: any;
  let officialResult: any;
  try {
    [gamesData, mappingResult, officialResult] = await Promise.all([
      fetchRoundGames(round.id),
      db.query(
        `SELECT team_id,provider_team_code FROM official_team_mappings
       WHERE season_id=$1 AND provider='euroleague_advanced'`,
        [seasonId]
      ),
      db.query(
        `SELECT game_code,round_number,scheduled_at,status,home_team_code,away_team_code,
              home_score,away_score,home_score_regtime,away_score_regtime,
              home_q1,away_q1,home_q2,away_q2,home_q3,away_q3,home_q4,away_q4,home_ot,away_ot
       FROM official_games
       WHERE season_id=$1 AND provider='euroleague_advanced'`,
        [seasonId]
      ),
    ]);
  } catch (error: any) {
    manager.error(`   ❌ Could not load fantasy/official match inputs: ${error.message}`);
    return { success: false, message: error.message, error };
  }

  const games = gamesData?.data?.games || gamesData?.games || [];
  const codeByTeam = new Map<number, string>(
    mappingResult.rows.map((row: any) => [row.team_id, row.provider_team_code])
  );
  const officialGames = officialResult.rows as OfficialMatchRow[];
  let synced = 0;
  let unresolved = 0;

  for (const game of games) {
    const homeId = game.home?.id;
    const awayId = game.away?.id;
    const homeCode = codeByTeam.get(homeId);
    const awayCode = codeByTeam.get(awayId);
    const candidates = officialGames.filter(
      (item) => item.home_team_code === homeCode && item.away_team_code === awayCode
    );
    const official = closestOfficialGame(
      candidates,
      roundNumber(round.name),
      typeof game.date === 'number' ? game.date : null
    );

    if (!homeId || !awayId || !official) {
      unresolved++;
      manager.log(
        `      ⚠️ Official game not linked for Biwenger game ${game.id} (${homeCode || homeId} vs ${awayCode || awayId}).`
      );
      continue;
    }

    await mutations.upsertMatch({
      round_id: dbRoundId,
      round_name: round.name,
      home_id: homeId,
      away_id: awayId,
      date: official.scheduled_at ? new Date(official.scheduled_at).toISOString() : null,
      status: official.status,
      home_score: official.home_score,
      away_score: official.away_score,
      home_score_regtime: official.home_score_regtime,
      away_score_regtime: official.away_score_regtime,
      home_q1: official.home_q1,
      away_q1: official.away_q1,
      home_q2: official.home_q2,
      away_q2: official.away_q2,
      home_q3: official.home_q3,
      away_q3: official.away_q3,
      home_q4: official.home_q4,
      away_q4: official.away_q4,
      home_ot: official.home_ot,
      away_ot: official.away_ot,
      official_game_code: official.game_code,
    });
    synced++;
  }

  manager.log(
    `   ✅ Linked ${synced} fantasy matches to official games (${unresolved} unresolved).`
  );
  return { success: unresolved === 0, message: `Linked ${synced} matches.`, data: games };
}

export const syncMatches = async (db: any, round: any, playersList: any) => {
  const mockManager = {
    context: { db, seasonId: process.env.SEASON_ID || '2026-27' },
    resolveRoundId: (value: any) => value.id,
    log: console.log,
    error: console.error,
  } as unknown as SyncManager;
  return run(mockManager, round, playersList);
};
