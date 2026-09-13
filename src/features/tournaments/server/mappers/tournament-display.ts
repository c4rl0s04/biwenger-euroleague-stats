import type { TournamentJson } from '../../models/tournaments';
import type { TournamentDisplayText } from '../../models/tournament-detail';

export function snapshotProperty(
  value: TournamentJson | undefined,
  key: string
): TournamentJson | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value[key]
    : undefined;
}

export function tournamentDisplayText(value: TournamentJson | undefined): TournamentDisplayText {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.map(tournamentDisplayText);
  if (typeof value === 'object')
    throw new TypeError('Tournament display value is not renderable text');
  return value;
}

export function tournamentIconUrl(value: TournamentJson | undefined): string | null {
  if (!value) return null;
  // The original UI called startsWith, so truthy non-string JSON already failed.
  if (typeof value !== 'string') throw new TypeError('Tournament icon is not a string');
  return value.startsWith('http') ? value : `https://cdn.biwenger.com/${value}`;
}
