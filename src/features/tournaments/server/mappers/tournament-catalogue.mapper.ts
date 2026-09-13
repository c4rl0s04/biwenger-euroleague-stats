import type { Tournament } from '../../models/tournaments';
import {
  snapshotProperty as property,
  tournamentDisplayText,
  tournamentIconUrl,
} from './tournament-display';
import type {
  DesktopTournamentCatalogue,
  DesktopTournamentCatalogueItem,
} from '../../models/tournament-catalogue';
import type {
  TournamentCatalogue,
  TournamentCatalogueItem,
} from '../../models/tournament-catalogue';

export function mapDesktopTournamentCatalogue(lists: {
  active: Tournament[];
  finished: Tournament[];
}): DesktopTournamentCatalogue {
  function item(tournament: Tournament): DesktopTournamentCatalogueItem {
    const isActive = tournament.status === 'active';
    const phase = isActive ? property(tournament.data, 'currentPhase') : undefined;
    const winner = !isActive ? property(tournament.data, 'winner') : undefined;
    return {
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      status: tournament.status,
      statusLabel: phase ? tournamentDisplayText(phase) : isActive ? 'En Curso' : 'Finalizado',
      winner: winner
        ? {
            name: tournamentDisplayText(property(winner, 'name')),
            iconUrl: tournamentIconUrl(property(winner, 'icon')),
          }
        : null,
    };
  }
  return { active: lists.active.map(item), finished: lists.finished.map(item) };
}

/** Project only phone catalogue fields; do not validate snapshot fields this screen never reads. */
export function mapTournamentCatalogue(lists: {
  active: Tournament[];
  finished: Tournament[];
}): TournamentCatalogue {
  function item(tournament: Tournament, finished: boolean): TournamentCatalogueItem {
    const name = finished ? property(property(tournament.data, 'winner'), 'name') : undefined;
    return {
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      winnerLabel: name ? `Campeón: ${name}` : 'Finalizado',
    };
  }
  return {
    active: lists.active.map((tournament) => item(tournament, false)),
    finished: lists.finished.map((tournament) => item(tournament, true)),
  };
}
