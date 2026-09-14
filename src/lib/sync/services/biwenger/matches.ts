import { fetchRoundGames } from '../../../api/biwenger-client';
import { euroleagueSeasonYear } from '../../../api/euroleague/normalization';
import type { OfficialScheduleGame } from '../../../api/euroleague/types';
import { CONFIG } from '../../../config';
import { prepareMatchMutations, type MatchMutations } from '../../../db/mutations/matches';
import type { SyncManager } from '../../manager';
import {
  getOfficialTeamMappings as defaultGetOfficialTeamMappings,
  type OfficialTeamMappingRecord,
} from '../../repositories/sync-queries';

export interface OfficialMatchRow {
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

export interface MatchesDependencies {
  fetchRoundGames?: (roundId: number) => Promise<any>;
  getOfficialTeamMappings?: (seasonId: string, db?: any) => Promise<OfficialTeamMappingRecord[]>;
  prepareMutations?: (db: unknown, options: { seasonId: string }) => MatchMutations;
  getSchedule?: (seasonYear: number) => Promise<OfficialScheduleGame[]>;
}

export function roundNumber(name: string): number | null {
  const match = /(?:Jornada|Round)\s+(\d+)/i.exec(name);
  return match ? Number(match[1]) : null;
}

export function closestOfficialGame(
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
 * Biwenger supplies fantasy round/team identities. Official schedules and game codes
 * are resolved from EuroLeague provider / context and persisted directly into matches.
 */
export async function syncBiwengerMatches(
  manager: SyncManager,
  round: any,
  _playersList: any = {},
  dependencies: MatchesDependencies = {}
) {
  const db = manager.context.db as any;
  const seasonId = manager.context.season?.seasonId || manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const dbRoundId = manager.resolveRoundId ? manager.resolveRoundId(round) : round.dbId || round.id;

  const mutationsFactory = dependencies.prepareMutations || prepareMatchMutations;
  const mutations = mutationsFactory(db, { seasonId });

  const fetchGames = dependencies.fetchRoundGames || fetchRoundGames;
  const getMappings = dependencies.getOfficialTeamMappings || defaultGetOfficialTeamMappings;

  let gamesData: any;
  let mappingResult: any;
  let officialGames: OfficialMatchRow[] = [];
  try {
    const getSchedulePromise = (async (): Promise<OfficialScheduleGame[]> => {
      if (manager.context.officialSchedule && manager.context.officialSchedule.length > 0) {
        return manager.context.officialSchedule;
      }
      if (dependencies.getSchedule) {
        const seasonCode =
          manager.context.season?.euroleagueCode ||
          CONFIG.EUROLEAGUE.SEASON_CODE ||
          `E${seasonId.slice(0, 4)}`;
        const seasonYear = euroleagueSeasonYear(seasonCode, seasonId);
        const schedule = await dependencies.getSchedule(seasonYear);
        manager.context.officialSchedule = schedule;
        return schedule;
      }
      if (
        manager.context.euroleague &&
        typeof manager.context.euroleague.getSchedule === 'function'
      ) {
        const seasonCode =
          manager.context.season?.euroleagueCode ||
          CONFIG.EUROLEAGUE.SEASON_CODE ||
          `E${seasonId.slice(0, 4)}`;
        const seasonYear = euroleagueSeasonYear(seasonCode, seasonId);
        const schedule = await manager.context.euroleague.getSchedule(seasonYear);
        manager.context.officialSchedule = schedule;
        return schedule;
      }
      return [];
    })();

    const [gamesRes, mappings, scheduleRes] = await Promise.all([
      fetchGames(round.id),
      getMappings(seasonId, db),
      getSchedulePromise,
    ]);
    gamesData = gamesRes;
    mappingResult = mappings;
    officialGames = scheduleRes.map((game: OfficialScheduleGame) => ({
      game_code: game.gameCode,
      round_number: game.roundNumber,
      scheduled_at: game.scheduledAt,
      status: game.isPlayed ? 'finished' : 'scheduled',
      home_team_code: game.homeTeamCode,
      away_team_code: game.awayTeamCode,
      home_score: null,
      away_score: null,
      home_score_regtime: null,
      away_score_regtime: null,
      home_q1: null,
      away_q1: null,
      home_q2: null,
      away_q2: null,
      home_q3: null,
      away_q3: null,
      home_q4: null,
      away_q4: null,
      home_ot: null,
      away_ot: null,
    }));
  } catch (error: any) {
    throw new Error('Could not load fantasy and official match inputs.', { cause: error });
  }

  const games = gamesData?.data?.games || gamesData?.games || [];
  const codeByTeam = new Map<number, string>(
    mappingResult.map((row: any) => [
      row.teamId ?? row.team_id,
      row.providerTeamCode ?? row.provider_team_code,
    ])
  );
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
  if (unresolved > 0) {
    throw new Error(`${unresolved} Biwenger matches could not be linked to official games.`);
  }
  return { synced, games: games.length };
}

/** Compatibility export */
export const run = syncBiwengerMatches;
