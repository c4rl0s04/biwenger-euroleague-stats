import 'server-only';
import { resolveRoundIdByPolicy } from '@/features/rounds/server';
import { getManagerDirectory, getOwnedPlayers } from '@/features/managers/server';
import {
  getScheduleRoundOptions,
  findScheduleRound,
  getLatestDatedScheduleRound,
  getScheduleFixtures,
  getMatchesScreenData,
} from '@/features/matches/server';
import {
  mapScheduleRound,
  mapSchedulePlayer,
  mapScheduleMatches,
} from '../mappers/schedule.mapper';
import type { UserSchedule, ScheduleMapModel } from '../../models/schedule';

export const SCHEDULE_READ_POLICY = {
  identity: 'page resolves session ID only; URL userId is ignored',
  serverCache: 'none for personalized reads; map retains Matches request memoization',
  rendering: 'request-time searchParams/auth/presentation; no route revalidation override',
  mutations: 'none; existing lineup command is a separate UI boundary',
} as const;

const dependencies = {
  resolveRoundIdByPolicy,
  getManagerDirectory,
  getOwnedPlayers,
  getScheduleRoundOptions,
  findScheduleRound,
  getLatestDatedScheduleRound,
  getScheduleFixtures,
  getMatchesScreenData,
};
export function createScheduleService(deps = dependencies) {
  async function getUserSchedule(
    userId: string | number,
    targetRoundId: string | number | null = null
  ): Promise<UserSchedule> {
    try {
      const activeRoundId = targetRoundId || (await deps.resolveRoundIdByPolicy('active_or_next'));
      let round = activeRoundId ? await deps.findScheduleRound(Number(activeRoundId)) : null;
      if (!round) round = await deps.getLatestDatedScheduleRound();
      if (!round) return { found: false, message: 'No upcoming rounds found.' };
      const [fixtures, owned] = await Promise.all([
        deps.getScheduleFixtures(Number(round.roundId)),
        deps.getOwnedPlayers(Number(userId)),
      ]);
      const players = owned.map(mapSchedulePlayer);
      if (!players.length)
        return {
          found: true,
          round: mapScheduleRound(round),
          matches: [],
          message: 'User has no players.',
        };
      const matches = mapScheduleMatches(fixtures, players);
      return {
        found: true,
        round: mapScheduleRound(round),
        matches,
        total_players: matches.reduce((sum, match) => sum + match.user_players.length, 0),
        userPlayers: players.sort((a, b) => (b.puntos || 0) - (a.puntos || 0)),
      };
    } catch (error) {
      // Retain the existing rendered message; never add full DB errors/payloads to logs.
      console.error('Error in getUserScheduleService');
      const message =
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : undefined;
      return { found: false, message };
    }
  }
  async function getScheduleReferenceData() {
    const [users, rounds] = await Promise.all([
      deps.getManagerDirectory(),
      deps.getScheduleRoundOptions(),
    ]);
    return { users, rounds: rounds.map(mapScheduleRound) };
  }
  async function getScheduleMapData(roundId: unknown): Promise<ScheduleMapModel> {
    const model = await deps.getMatchesScreenData(roundId);
    return {
      matches: model.rounds.find((round) => round.roundId === model.selectedRoundId)?.matches ?? [],
      backHref: '/schedule' + (model.selectedRoundId ? '?roundId=' + model.selectedRoundId : ''),
    };
  }
  return { getUserSchedule, getScheduleReferenceData, getScheduleMapData };
}
export const { getUserSchedule, getScheduleReferenceData, getScheduleMapData } =
  createScheduleService();
