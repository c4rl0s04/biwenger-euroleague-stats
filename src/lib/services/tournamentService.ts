import 'server-only';

// Existing page, Profile and global-analytics callers keep one implementation.
export {
  getAllTournaments,
  getStandings,
  getFixtures,
  fetchUserTournaments,
} from '@/features/tournaments/server';

import { getTournamentDetails as getFeatureTournamentDetails } from '@/features/tournaments/server';
import type { Tournament } from '@/features/tournaments/public';

// Legacy screens were compiled against an inaccurate non-null name declaration.
// Retain only that old typing here, without coercing runtime nulls. Remove this
// compatibility assertion when Tournament screens adopt the nullable feature model.
export function getTournamentDetails(id: string | number) {
  return getFeatureTournamentDetails(id) as Promise<(Tournament & { name: string }) | null>;
}
