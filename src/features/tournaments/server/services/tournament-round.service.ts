import 'server-only';

import { resolveRoundIdByPolicy } from '@/features/rounds/server';
import type { Tournament, TournamentFixture } from '../../models/tournaments';

/** Desktop-only selection: preserve the existing page policy and query timing. */
export function createTournamentRoundService(resolveRound: typeof resolveRoundIdByPolicy) {
  return async function getTournamentInitialRoundId(
    tournament: Pick<Tournament, 'status'>,
    fixtures: Pick<TournamentFixture, 'round_id'>[]
  ): Promise<number | null | undefined> {
    if (tournament.status === 'active') return resolveRound('active_or_next');
    if (fixtures.length > 0) {
      const sorted = [...fixtures].sort((a, b) => (b.round_id || 0) - (a.round_id || 0));
      return sorted[0]?.round_id;
    }
    return null;
  };
}

export const getTournamentInitialRoundId = createTournamentRoundService(resolveRoundIdByPolicy);
