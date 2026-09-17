import 'server-only';

import { getTournamentDetails, getStandings, getFixtures } from './tournament-read.service';
import type { Tournament, TournamentStanding, TournamentFixture } from '../../models/tournaments';
import type { TournamentSectionModel } from '../../models/tournament-section';

interface SectionDependencies {
  detail(id: string): Promise<Tournament | null>;
  standings(id: string): Promise<TournamentStanding[]>;
  fixtures(id: string): Promise<TournamentFixture[]>;
}

// The framework adapter validates mobile routing before invoking this read.
// No cache or identity fallback; retain all three reads even for an absent detail.
export function createTournamentSectionService(deps: SectionDependencies) {
  return async function getTournamentSection(
    id: string,
    section: string
  ): Promise<TournamentSectionModel | null> {
    const [tournament, standings, fixtures] = await Promise.all([
      deps.detail(id),
      deps.standings(id),
      deps.fixtures(id),
    ]);
    if (!tournament) return null;
    return { name: tournament.name, data: section === 'standings' ? standings : fixtures };
  };
}
export const getTournamentSection = createTournamentSectionService({
  detail: getTournamentDetails,
  standings: getStandings,
  fixtures: getFixtures,
});
