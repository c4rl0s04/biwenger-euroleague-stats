import 'server-only';

import {
  getTournaments,
  getTournamentById,
  getTournamentStandings,
  getTournamentFixtures,
} from '../db';

/**
 * Fetch all tournaments and categorize them into active and finished.
 * This service layer abstracts the data fetching and business logic classification.
 *
 * @returns { active, finished, all }
 */
export async function getAllTournaments() {
  const allTournaments = await getTournaments();

  const activeTournaments = allTournaments.filter((t: any) => t.status === 'active');
  const finishedTournaments = allTournaments.filter((t: any) => t.status !== 'active');

  return {
    active: activeTournaments,
    finished: finishedTournaments,
    all: allTournaments,
  };
}

/**
 * Fetch details for a specific tournament
 */
export async function getTournamentDetails(id: string | number) {
  const tournament = await getTournamentById(Number(id));
  return tournament;
}

/**
 * Fetch standings for a specific tournament
 */
export async function getStandings(id: string | number) {
  const standings = await getTournamentStandings(Number(id));
  return standings;
}

/**
 * Fetch fixtures for a specific tournament
 */
export async function getFixtures(id: string | number | null = null) {
  const fixtures = await getTournamentFixtures(id ? Number(id) : null);
  return fixtures;
}
