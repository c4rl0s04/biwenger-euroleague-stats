import type { Tournament } from '../../models/tournaments';
import type { TournamentPhoneDetail } from '../../models/tournament-detail';
import {
  snapshotProperty as property,
  tournamentDisplayText as displayText,
} from './tournament-display';

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
