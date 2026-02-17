import { fetchTournament, fetchRoundsLeague, fetchCompetition } from '../../api/biwenger-client.js';
import * as tournamentMutations from '../../db/mutations/tournaments.js';
import { CONFIG } from '../../config.js';

export async function run() {
  console.log('🏆 Starting Tournament Sync...');

  // 1. Discovery: Scan FULL SEASON to find all tournaments (Active & Finished)
  console.log('   > Discovering tournaments from Full Season Schedule...');

  const tournamentIds = new Set();

  try {
    // A. Get the list of all rounds in the season
    const compData = await fetchCompetition();
    const allRounds = compData.data?.season?.rounds || [];

    if (allRounds.length === 0) {
      console.warn('   > Warning: No rounds found in competition data.');
    } else {
      console.log(`   > Scanning ${allRounds.length} rounds for tournament fixtures...`);
    }

    // B. Iterate through all rounds to find tournaments
    // We process sequentially to avoid rate limits, but could parallelize with caution
    for (const round of allRounds) {
      // Optimization: We could skip 'pending' rounds if we only want past/active,
      // but checking future rounds might reveal upcoming tournaments.
      // Let's stick to finished/active/pending to be thorough.

      try {
        const roundDetail = await fetchRoundsLeague(round.id);
        if (roundDetail.data && roundDetail.data.fixtures) {
          for (const fixture of roundDetail.data.fixtures) {
            if (fixture.tournament && fixture.tournament.id) {
              const tId = fixture.tournament.id;
              if (!tournamentIds.has(tId)) {
                tournamentIds.add(tId);
                console.log(
                  `   > 🎯 Discovered "${fixture.tournament.name}" (ID: ${tId}) in Round ${round.name}`
                );
              }
            }
          }
        }
      } catch (err) {
        // Suppress 404s or minor errors for individual rounds
        // console.warn(`   > Failed to scan Round ${round.id}: ${err.message}`);
      }
    }
  } catch (e) {
    console.warn('   > Warning: Failed to scan season for tournaments:', e.message);
  }

  if (tournamentIds.size === 0) {
    console.log('   > No tournaments found in any round.');
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
