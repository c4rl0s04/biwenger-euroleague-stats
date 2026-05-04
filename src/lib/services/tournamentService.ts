import 'server-only';

import {
  getTournaments,
  getTournamentById,
  getTournamentStandings,
  getTournamentFixtures,
  getUserTournaments,
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

/**
 * Fetch tournaments and standings for a specific user
 */
export async function fetchUserTournaments(userId: string | number) {
  const userTournaments = await getUserTournaments(userId);
  const uid = Number(userId);

  return userTournaments.map((t: any) => {
    // If it's a league, return as is (but remove large data_json to save payload)
    if (t.tournament_type !== 'playoff') {
      const { data_json, ...rest } = t;
      return rest;
    }

    // For playoffs, we compute stats from data_json
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let furthestPhase = 'Desconocida';
    let isChampion = false;

    if (t.data_json) {
      try {
        const data = typeof t.data_json === 'string' ? JSON.parse(t.data_json) : t.data_json;

        if (data.rounds && Array.isArray(data.rounds)) {
          // Iterate over rounds in order
          data.rounds.forEach((round: any) => {
            if (round.fixtures) {
              round.fixtures.forEach((fixture: any) => {
                const isHome = fixture.home && fixture.home.id === uid;
                const isAway = fixture.away && fixture.away.id === uid;

                if (isHome || isAway) {
                  // User participated in this fixture, meaning they reached this phase
                  furthestPhase = translatePhaseType(round.type);

                  const myScore = isHome ? fixture.home.score : fixture.away.score;
                  const opScore = isHome ? fixture.away.score : fixture.home.score;

                  // Update match stats if scores exist
                  if (
                    myScore !== undefined &&
                    opScore !== undefined &&
                    myScore !== null &&
                    opScore !== null
                  ) {
                    if (myScore > opScore) won++;
                    else if (myScore < opScore) lost++;
                    else drawn++;

                    // If it's the final and they won, they are the champion
                    if (round.type === 'final' && myScore > opScore) {
                      isChampion = true;
                    }
                  }
                }
              });
            }
          });
        }

        // Final override if champion is in the root winner object
        if (data.winner && data.winner.id === uid) {
          isChampion = true;
        }
      } catch (e) {
        console.error('Error parsing playoff data_json', e);
      }
    }

    const { data_json, ...rest } = t;
    return {
      ...rest,
      won,
      drawn,
      lost,
      phase_name: isChampion ? 'Campeón' : furthestPhase,
    };
  });
}

function translatePhaseType(type: string) {
  const map: Record<string, string> = {
    final: 'Final',
    semiFinal: 'Semifinal',
    quarterFinal: 'Cuartos de final',
    roundOf16: 'Octavos de final',
    roundOf32: 'Dieciseisavos',
  };
  return map[type] || type;
}
