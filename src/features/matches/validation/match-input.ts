export class MatchesInputError extends Error {
  readonly code = 'INVALID_MATCH_INPUT';
}

export function parseOptionalPositiveInteger(
  value: unknown,
  name: string
): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new MatchesInputError(`${name} must be a positive integer.`);
  }
  return parsed;
}

export function parseRoundId(value: unknown): number | null {
  try {
    return parseOptionalPositiveInteger(value, 'Round ID') ?? null;
  } catch {
    return null;
  }
}

export interface OfficialGameFilterInput {
  period?: unknown;
  playerId?: unknown;
  teamCode?: unknown;
}

export interface OfficialGameFilters {
  period?: number;
  playerId?: number;
  teamCode?: string;
}

export function parseOfficialGameFilters(input: OfficialGameFilterInput): OfficialGameFilters {
  const period = parseOptionalPositiveInteger(input.period, 'period');
  const playerId = parseOptionalPositiveInteger(input.playerId, 'playerId');
  const teamCode =
    typeof input.teamCode === 'string' ? input.teamCode.trim().toUpperCase() : undefined;

  if (teamCode && !/^[A-Z0-9_-]{2,12}$/.test(teamCode)) {
    throw new MatchesInputError('Invalid teamCode.');
  }

  return {
    ...(period ? { period } : {}),
    ...(playerId ? { playerId } : {}),
    ...(teamCode ? { teamCode } : {}),
  };
}
