import type { Tournament } from '../../models/tournaments';
import type {
  TournamentPhoneDetail,
  TournamentDesktopDetail,
} from '../../models/tournament-detail';
import {
  snapshotProperty as property,
  tournamentDisplayText as displayText,
  tournamentIconUrl,
} from './tournament-display';

export function mapTournamentDesktopDetail(tournament: Tournament): TournamentDesktopDetail {
  const winner = tournament.status === 'active' ? undefined : property(tournament.data, 'winner');
  const name = winner ? property(winner, 'name') : undefined;
  return {
    id: tournament.id,
    name: tournament.name,
    type: tournament.type,
    status: tournament.status,
    winner: winner
      ? {
          href: `/user/${property(winner, 'id') || name}`,
          iconUrl: tournamentIconUrl(property(winner, 'icon')),
          name: displayText(name),
        }
      : winner === 0
        ? 0
        : winner === ''
          ? ''
          : winner === false
            ? false
            : null,
  };
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
