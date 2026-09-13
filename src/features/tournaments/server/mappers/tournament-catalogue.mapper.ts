import type { Tournament, TournamentJson } from '../../models/tournaments';
import type {
  TournamentCatalogue,
  TournamentCatalogueItem,
} from '../../models/tournament-catalogue';

function property(value: TournamentJson | undefined, key: string): TournamentJson | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value[key]
    : undefined;
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
