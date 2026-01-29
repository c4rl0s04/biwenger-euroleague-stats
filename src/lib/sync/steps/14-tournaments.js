import { fetchHome, fetchTournament } from '../../api/biwenger-client.js';
import * as tournamentMutations from '../../db/mutations/tournaments.js';
import { CONFIG } from '../../config.js';

export async function run() {
  console.log('🏆 Starting Tournament Sync...');

  // 1. Discovery: Fetch Home to find active tournaments
  console.log('   > Discovering tournaments from Dashboard...');
  const homeData = await fetchHome();
  const events = homeData.data ? homeData.data.events || [] : [];

  // Extract unique tournament IDs from the events feed
  const tournamentIds = new Set();

  // Method A: Deep search in events -> fixtures
  // The 'events' array usually contains the current round (e.g. Round 25).
  // Inside that round object, there is a 'fixtures' array containing the user's matches.
  // These fixtures may belong to 'tournaments'.

  for (const event of events) {
    // 1. Direct tournament on event (rare, but possible)
    if (event.tournament && event.tournament.id) {
      tournamentIds.add(event.tournament.id);
    }

    // 2. Nested fixtures in the event (Common for active rounds)
    if (event.fixtures && Array.isArray(event.fixtures)) {
      for (const fixture of event.fixtures) {
        if (fixture.tournament && fixture.tournament.id) {
          tournamentIds.add(fixture.tournament.id);
          console.log(
            `   > Discovered tournament info for "${fixture.tournament.name}" (ID: ${fixture.tournament.id})`
          );
        }
      }
    }

    // 3. Nested games (sometimes called games instead of fixtures)
    if (event.games && Array.isArray(event.games)) {
      for (const game of event.games) {
        if (game.tournament && game.tournament.id) {
          tournamentIds.add(game.tournament.id);
        }
      }
    }
  }

  // Method B: From league.board
  if (homeData.data.league && homeData.data.league.board) {
    for (const item of homeData.data.league.board) {
      if (item.type === 'tournament' && item.content && item.content.tournament) {
        tournamentIds.add(item.content.tournament.id);
      }
    }
  }

  if (tournamentIds.size === 0) {
    console.log('   > No active tournaments found.');
    return;
  }

  console.log(
    `   > Found ${tournamentIds.size} tournament(s): [${Array.from(tournamentIds).join(', ')}]`
  );

  // 2. Deep Sync: Process each tournament
  for (const tId of tournamentIds) {
    console.log(`   > Syncing Tournament ID: ${tId}...`);
    try {
      const tData = await fetchTournament(tId);
      const data = tData.data;

      // -- A. Upsert Tournament --
      await tournamentMutations.upsertTournament({
        id: data.id,
        league_id: CONFIG.API.LEAGUE_ID,
        name: data.name,
        type: data.type || 'unknown',
        status: data.status || 'active',
        data_json: JSON.stringify(data),
        updated_at: Math.floor(Date.now() / 1000),
      });

      // -- B. Process Rounds & Fixtures (Revised) --
      // The API structure puts rounds at the top level, and 'phases' is an object metadata.
      // We will derive phases from the rounds' structure or just create a default phase.

      if (data.rounds && Array.isArray(data.rounds)) {
        // Group rounds by type to create logical phases
        // -- A. Upsert Phases --
        const phasesMap = new Map(); // type -> db_id
        const foundPhaseTypes = new Set();
        const phasesList = [];

        // 1. Gather phases from explicit 'phases' object/array
        if (data.phases) {
          if (Array.isArray(data.phases)) {
            data.phases.forEach((p) => {
              foundPhaseTypes.add(p.type);
              phasesList.push({ type: p.type, name: p.name || p.type, order: 0 });
            });
          } else if (typeof data.phases === 'object') {
            // For Torneo #2 style: phases: { league: {...} }
            Object.keys(data.phases).forEach((key) => {
              const p = data.phases[key];
              foundPhaseTypes.add(key); // Use key as type
              phasesList.push({ type: key, name: p.name || key, order: 0 });
            });
          }
        }

        // 2. Gather phases implicitly from 'rounds' (CRITICAL for Eliminatoria #2)
        if (data.rounds && Array.isArray(data.rounds)) {
          data.rounds.forEach((r) => {
            if (r.type && !foundPhaseTypes.has(r.type)) {
              foundPhaseTypes.add(r.type);
              // Infer a name if possible
              const name = r.type.charAt(0).toUpperCase() + r.type.slice(1);
              phasesList.push({ type: r.type, name: name, order: r.index || 0 });
            }
          });
        }

        // 3. Upsert All Collected Phases
        for (const p of phasesList) {
          const id = await tournamentMutations.upsertPhase({
            tournament_id: data.id,
            name: p.name,
            type: p.type,
            order_index: p.order || 0,
          });
          phasesMap.set(p.type, id);
        }

        // Now iterate through rounds and assign them to phases
        for (const round of data.rounds) {
          const phaseType = round.type || 'unknown';
          const dbPhaseId = phasesMap.get(phaseType); // Get the ID for the phase type

          // If for some reason a phase wasn't created (e.g., 'unknown' type not explicitly handled),
          // we might need a fallback or ensure it's always created.
          // For now, assuming phasesMap will contain all necessary types.
          if (!dbPhaseId) {
            console.warn(
              `   > Warning: No phase ID found for type '${phaseType}' in tournament ${data.id}. Skipping round processing.`
            );
            continue;
          }

          const roundName = round.name || (round.round ? round.round.name : `Round ${round.index}`);
          // Extract global round ID (e.g. 4764)
          const globalRoundId = round.round ? round.round.id : null;

          // Process Fixtures
          if (round.fixtures && Array.isArray(round.fixtures)) {
            for (const fixture of round.fixtures) {
              // Map User IDs safely
              const homeId = fixture.home?.id ? String(fixture.home.id) : null;
              const awayId = fixture.away?.id ? String(fixture.away.id) : null;

              await tournamentMutations.upsertFixture({
                id: fixture.id,
                tournament_id: data.id,
                phase_id: dbPhaseId,
                round_name: roundName,
                round_id: globalRoundId,
                group_name: fixture.group || null,
                home_user_id: homeId,
                away_user_id: awayId,
                home_score: fixture.home?.score ?? null,
                away_score: fixture.away?.score ?? null,
                date: fixture.date || null,
                status: fixture.status || 'scheduled',
              });
            }
          }
        }
      }

      // -- C. Process Standings (New) --
      // Standings are usually inside data.phases -> [phaseName] -> groups -> [0] -> standings
      // or data.phases -> [phaseType] -> groups

      if (data.phases) {
        // Iterate over keys since phases is an object in some API responses (like Torneo #2)
        // Inspecting trace showed: "phases": { "league": { "groups": [...] } }
        const phaseKeys = Object.keys(data.phases);

        for (const pKey of phaseKeys) {
          const phaseObj = data.phases[pKey];

          if (phaseObj && phaseObj.groups && Array.isArray(phaseObj.groups)) {
            for (const group of phaseObj.groups) {
              const groupName = group.name || null;

              if (group.standings && Array.isArray(group.standings)) {
                for (const row of group.standings) {
                  const userId = row.team?.id ? String(row.team.id) : null;
                  if (!userId) continue;

                  await tournamentMutations.upsertStanding({
                    tournament_id: data.id,
                    phase_name: pKey, // e.g., "league"
                    group_name: groupName, // e.g., "A"
                    user_id: userId,
                    position: row.position,
                    points: row.points,
                    won: row.won,
                    lost: row.lost,
                    drawn: row.tied || row.drawn || 0,
                    scored: row.scored,
                    against: row.against,
                  });
                }
              }
            }
          }
        }
        console.log('     ✅ Synced Standings');
      }
      console.log(`     ✅ Synced ${data.name}`);
    } catch (e) {
      console.error(`     ❌ Failed to sync tournament ${tId}:`, e.message);
    }
  }
}
