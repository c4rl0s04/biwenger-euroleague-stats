import type { Tournament, TournamentJson } from '../../models/tournaments';
import type { TournamentDisplayText, TournamentPhoneDetail } from '../../models/tournament-detail';

function property(value: TournamentJson | undefined, key: string): TournamentJson | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value[key]
    : undefined;
}

function displayText(value: TournamentJson | undefined): TournamentDisplayText {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.map(displayText);
  if (typeof value === 'object') {
    // Ordinary JSON objects already fail when React renders the original winner name.
    throw new TypeError('Tournament winner name is not renderable text');
  }
  return value;
}

export function mapTournamentPhoneDetail(tournament: Tournament): TournamentPhoneDetail {
  const winner = property(tournament.data, 'winner');
  return {
    id: tournament.id,
    name: tournament.name,
    type: tournament.type,
    status: tournament.status,
    // Preserve the legacy zero rendered by the winner && banner expression.
    winner: winner
      ? { name: displayText(property(winner, 'name')) }
      : winner === 0
        ? 0
        : winner === ''
          ? ''
          : winner === false
            ? false
            : null,
  };
}
