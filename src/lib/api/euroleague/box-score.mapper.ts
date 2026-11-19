import { asBoolean, asString, normalizeEuroleaguePlayerCode, requiredString } from './normalization';
import type { EuroleagueRow } from './schemas';
import type { EuroleaguePlayerBoxScore } from './types';

export interface ParsedMinutes {
  raw: string | null;
  seconds: number | null;
  isDnp: boolean | null;
}

export function parseMinutes(value: unknown): ParsedMinutes {
  const text = asString(value)?.trim();
  if (!text) {
    return { raw: null, seconds: null, isDnp: null };
  }
  const upper = text.toUpperCase();
  if (upper === 'DNP' || upper === 'DNE' || upper === 'CDNP') {
    return { raw: text, seconds: null, isDnp: true };
  }
  const match = /^(\d+):([0-5]?\d)$/.exec(text);
  if (!match) {
    throw new Error(`Invalid minutes format: "${text}"`);
  }
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  return {
    raw: text,
    seconds: minutes * 60 + seconds,
    isDnp: false,
  };
}

export function parseProviderNumber(value: unknown, fieldName: string): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${fieldName}: ${JSON.stringify(value)}`);
  }
  return parsed;
}

export function minutesToSeconds(value: string | null): number | null {
  return parseMinutes(value).seconds;
}

export function mapEuroleagueBoxScoreRow(
  row: EuroleagueRow,
  gameCode: number
): EuroleaguePlayerBoxScore {
  const parsedMin = parseMinutes(row.Minutes);
  return {
    gameCode,
    playerCode: normalizeEuroleaguePlayerCode(row.Player_ID),
    playerName: requiredString(row, 'Player'),
    teamCode: requiredString(row, 'Team'),
    isHome: row.Home == null ? null : asBoolean(row.Home),
    isStarter: row.IsStarter == null ? null : asBoolean(row.IsStarter),
    isPlaying: row.IsPlaying == null ? null : asBoolean(row.IsPlaying),
    dorsal: asString(row.Dorsal),
    minutes: parsedMin.raw,
    minutesSeconds: parsedMin.seconds,
    isDnp: parsedMin.isDnp,
    points: parseProviderNumber(row.Points, 'Points'),
    twoPointsMade: parseProviderNumber(row.FieldGoalsMade2, 'FieldGoalsMade2'),
    twoPointsAttempted: parseProviderNumber(row.FieldGoalsAttempted2, 'FieldGoalsAttempted2'),
    threePointsMade: parseProviderNumber(row.FieldGoalsMade3, 'FieldGoalsMade3'),
    threePointsAttempted: parseProviderNumber(row.FieldGoalsAttempted3, 'FieldGoalsAttempted3'),
    freeThrowsMade: parseProviderNumber(row.FreeThrowsMade, 'FreeThrowsMade'),
    freeThrowsAttempted: parseProviderNumber(row.FreeThrowsAttempted, 'FreeThrowsAttempted'),
    offensiveRebounds: parseProviderNumber(row.OffensiveRebounds, 'OffensiveRebounds'),
    defensiveRebounds: parseProviderNumber(row.DefensiveRebounds, 'DefensiveRebounds'),
    totalRebounds: parseProviderNumber(row.TotalRebounds, 'TotalRebounds'),
    assists: parseProviderNumber(row.Assistances, 'Assistances'),
    steals: parseProviderNumber(row.Steals, 'Steals'),
    turnovers: parseProviderNumber(row.Turnovers, 'Turnovers'),
    blocks: parseProviderNumber(row.BlocksFavour, 'BlocksFavour'),
    blocksAgainst: parseProviderNumber(row.BlocksAgainst, 'BlocksAgainst'),
    foulsCommitted: parseProviderNumber(row.FoulsCommited, 'FoulsCommited'),
    foulsReceived: parseProviderNumber(row.FoulsReceived, 'FoulsReceived'),
    valuation: parseProviderNumber(row.Valuation, 'Valuation'),
    plusMinus: parseProviderNumber(row.Plusminus, 'Plusminus'),
    raw: row,
  };
}
