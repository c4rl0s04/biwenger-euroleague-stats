// Frozen participation algorithm from 881e4818; test-only compatibility oracle.
export function baselineParticipation(userTournaments: any[], userId: string | number) {
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
