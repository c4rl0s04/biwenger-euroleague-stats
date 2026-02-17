import { getTournaments } from '@/lib/db';

/**
 * Fetch all tournaments and categorize them into active and finished.
 * This service layer abstracts the data fetching and business logic classification.
 *
 * @returns {Promise<{active: Array, finished: Array, all: Array}>}
 */
export async function getAllTournaments() {
  const allTournaments = await getTournaments();

  const activeTournaments = allTournaments.filter((t) => t.status === 'active');
  const finishedTournaments = allTournaments.filter((t) => t.status !== 'active');

  return {
    active: activeTournaments,
    finished: finishedTournaments,
    all: allTournaments,
  };
}
