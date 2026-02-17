import {
  getTournaments,
  getTournamentById,
  getTournamentStandings,
  getTournamentFixtures,
} from '@/lib/db';

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

/**
 * Fetch details for a specific tournament
 */
export async function getTournamentDetails(id) {
  const tournament = await getTournamentById(id);
  return tournament;
}

/**
 * Fetch standings for a specific tournament
 */
export async function getStandings(id) {
  const standings = await getTournamentStandings(id);
  return standings;
}

/**
 * Fetch fixtures for a specific tournament
 */
export async function getFixtures(id) {
  const fixtures = await getTournamentFixtures(id);
  return fixtures;
}
