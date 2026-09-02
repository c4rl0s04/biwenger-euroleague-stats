import type { OfficialGameFilterInput } from '../../validation/match-input';
import {
  MatchesInputError,
  parseOfficialGameFilters,
  parseOptionalPositiveInteger,
} from '../../validation/match-input';
import {
  getOfficialPlayByPlay,
  getOfficialShots,
} from '../queries/official-game.query';

export { MatchesInputError };

export interface OfficialGameRequest {
  matchId: unknown;
  filters: OfficialGameFilterInput;
}

export interface OfficialGameServiceResult<T> {
  data: T | null;
  cacheSeconds: number;
}

function cacheSecondsFor(result: { finalizedAt?: unknown } | null): number {
  return result?.finalizedAt ? 3600 : 15;
}

function parseRequest(request: OfficialGameRequest) {
  const matchId = parseOptionalPositiveInteger(request.matchId, 'Match ID');
  if (matchId == null) throw new MatchesInputError('Match ID must be a positive integer.');
  return { matchId, filters: parseOfficialGameFilters(request.filters) };
}

export async function getOfficialPlayByPlayData(
  request: OfficialGameRequest
): Promise<OfficialGameServiceResult<NonNullable<Awaited<ReturnType<typeof getOfficialPlayByPlay>>>>> {
  const input = parseRequest(request);
  const data = await getOfficialPlayByPlay(input.matchId, input.filters);
  return { data, cacheSeconds: cacheSecondsFor(data) };
}

export async function getOfficialShotData(
  request: OfficialGameRequest
): Promise<OfficialGameServiceResult<NonNullable<Awaited<ReturnType<typeof getOfficialShots>>>>> {
  const input = parseRequest(request);
  const data = await getOfficialShots(input.matchId, input.filters);
  return { data, cacheSeconds: cacheSecondsFor(data) };
}
