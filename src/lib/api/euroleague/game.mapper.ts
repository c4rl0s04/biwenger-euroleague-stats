import {
  asBoolean,
  asNumber,
  asString,
  normalizeEuroleaguePlayerCode,
  requiredNumber,
  requiredString,
} from './normalization';
import type { EuroleagueRow } from './schemas';
import type {
  EuroleagueGameReport,
  EuroleagueGameMetadata,
  EuroleaguePlayByPlayEvent,
  EuroleagueShot,
} from './types';

function parseIsoDate(value: unknown): Date | null {
  const text = asString(value);
  if (!text || !/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseProviderUtc(value: unknown): Date | null {
  const raw = asString(value);
  if (!raw || !/^\d{14}$/.test(raw)) return null;
  return new Date(
    `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}Z`
  );
}

function quarters(row: EuroleagueRow, team: 'A' | 'B'): (number | null)[] {
  const cumulative = [1, 2, 3, 4].map((quarter) => asNumber(row[`ScoreQuarter${quarter}${team}`]));
  return cumulative.map((score, index) => {
    if (score == null) return null;
    const prev = index === 0 ? 0 : cumulative[index - 1];
    if (prev == null) return null;
    return score - prev;
  });
}

export function mapEuroleagueGameReport(
  row: EuroleagueRow,
  gameCode: number
): EuroleagueGameReport {
  return {
    gameCode,
    roundNumber: asNumber(row.Round),
    phase: asString(row['phaseType.code']) || asString(row['phaseType.name']),
    homeTeamCode: requiredString(row, 'local.club.code'),
    awayTeamCode: requiredString(row, 'road.club.code'),
    homeScore: asNumber(row['local.score']),
    awayScore: asNumber(row['road.score']),
    scheduledAt: parseIsoDate(row.utcDate) || parseIsoDate(row.date),
    isPlayed: asBoolean(row.played),
    homeCrestUrl: asString(row['local.club.images.crest']),
    awayCrestUrl: asString(row['road.club.images.crest']),
    raw: row,
  };
}

export function mapEuroleagueGameMetadata(
  row: EuroleagueRow,
  gameCode: number
): EuroleagueGameMetadata {
  return {
    gameCode,
    isLive: asBoolean(row.Live),
    homeScore: asNumber(row.ScoreA),
    awayScore: asNumber(row.ScoreB),
    homeQuarterScores: quarters(row, 'A'),
    awayQuarterScores: quarters(row, 'B'),
    homeOvertime: asNumber(row.ScoreExtraTimeA),
    awayOvertime: asNumber(row.ScoreExtraTimeB),
    arenaName: asString(row.Stadium),
    arenaCapacity: asNumber(row.Capacity),
    homeCoach: asString(row.CoachA),
    awayCoach: asString(row.CoachB),
    referees: [row.Referee1, row.Referee2, row.Referee3]
      .map(asString)
      .filter((value): value is string => Boolean(value)),
    raw: row,
  };
}

export function mapEuroleaguePlayByPlayEvent(
  row: EuroleagueRow,
  gameCode: number
): EuroleaguePlayByPlayEvent {
  return {
    gameCode,
    sequence: requiredNumber(row, 'TRUE_NUMBEROFPLAY'),
    providerPlayNumber: asNumber(row.NUMBEROFPLAY),
    period: asNumber(row.PERIOD),
    minute: asNumber(row.MINUTE),
    markerTime: asString(row.MARKERTIME),
    playType: asString(row.PLAYTYPE),
    teamCode: asString(row.CODETEAM),
    playerCode: asString(row.PLAYER_ID) ? normalizeEuroleaguePlayerCode(row.PLAYER_ID) : null,
    playerName: asString(row.PLAYER),
    teamName: asString(row.TEAM),
    dorsal: asString(row.DORSAL),
    homeScore: asNumber(row.POINTS_A),
    awayScore: asNumber(row.POINTS_B),
    comment: asString(row.COMMENT),
    playInfo: asString(row.PLAYINFO),
    raw: row,
  };
}

export function mapEuroleagueShot(row: EuroleagueRow, gameCode: number): EuroleagueShot {
  return {
    gameCode,
    annotationNumber: requiredNumber(row, 'NUM_ANOT'),
    teamCode: asString(row.TEAM),
    playerCode: asString(row.ID_PLAYER) ? normalizeEuroleaguePlayerCode(row.ID_PLAYER) : null,
    playerName: asString(row.PLAYER),
    actionId: asString(row.ID_ACTION),
    action: asString(row.ACTION),
    points: asNumber(row.POINTS) ?? 0,
    coordinateX: asNumber(row.COORD_X),
    coordinateY: asNumber(row.COORD_Y),
    zone: asString(row.ZONE),
    isFastbreak: asBoolean(row.FASTBREAK),
    isSecondChance: asBoolean(row.SECOND_CHANCE),
    isPointsOffTurnover: asBoolean(row.POINTS_OFF_TURNOVER),
    minute: asNumber(row.MINUTE),
    markerTime: asString(row.CONSOLE),
    homeScore: asNumber(row.POINTS_A),
    awayScore: asNumber(row.POINTS_B),
    occurredAt: parseProviderUtc(row.UTC),
    raw: row,
  };
}
