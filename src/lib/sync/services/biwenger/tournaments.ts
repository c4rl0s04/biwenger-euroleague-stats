import { fetchRoundsLeague, fetchTournament } from '../../../api/biwenger-client';
import { CONFIG } from '../../../config';
import {
  prepareTournamentMutations,
  type TournamentMutations,
} from '../../../db/mutations/tournaments';
import type { SyncManager } from '../../manager';

export interface TournamentsDependencies {
  fetchRoundsLeague?: (roundId: number) => Promise<any>;
  fetchTournament?: (tournamentId: number) => Promise<any>;
  prepareMutations?: (db: unknown, options: { seasonId: string }) => TournamentMutations;
  leagueId?: number | string;
}

export function computeTournamentStatus(data: any): 'active' | 'finished' {
  if (data.winner) return 'finished';
  if (data.status === 'finished') return 'finished';

  if (data.rounds && Array.isArray(data.rounds)) {
    let allFinished = true;
    let hasMatches = false;

    for (const round of data.rounds) {
      if (round.fixtures) {
        for (const f of round.fixtures) {
          hasMatches = true;
          if (f.status !== 'finished' && !f.home?.score && !f.away?.score) {
            allFinished = false;
            break;
          }
        }
      }
      if (!allFinished) break;
    }

    if (hasMatches && allFinished) {
      return 'finished';
    }
  }

  return (data.status || 'active') as 'active' | 'finished';
}

export async function syncBiwengerTournaments(
  manager: SyncManager,
  dependencies: TournamentsDependencies = {}
) {
  manager.log('🏆 Starting Tournament Sync...');
  const seasonId = manager.context.seasonId;
  if (!seasonId) {
    throw new Error('Canonical sync season was not resolved before tournament ingestion.');
  }

  const mutationsFactory = dependencies.prepareMutations || prepareTournamentMutations;
  const tournamentMutations = mutationsFactory(manager.context.db as any, { seasonId });
  const getRoundDetail = dependencies.fetchRoundsLeague || fetchRoundsLeague;
  const getTournament = dependencies.fetchTournament || fetchTournament;
  const leagueId = Number(dependencies.leagueId || CONFIG.API.LEAGUE_ID);

  // 1. Discovery: Scan FULL SEASON to find all tournaments (Active & Finished)
  manager.log('   > Discovering tournaments from Full Season Schedule...');
  const tournamentIds = new Set<number>();

  const snapshot = await manager.getBiwengerCompetition();
  const allRounds = snapshot.rounds;

  if (allRounds.length === 0) {
    throw new Error('Biwenger competition contains no rounds for tournament discovery.');
  }
  manager.log(`   > Scanning ${allRounds.length} rounds for tournament fixtures...`);

  for (const round of allRounds) {
    const roundDetail = await getRoundDetail(round.id);
    if (roundDetail?.data?.fixtures) {
      for (const fixture of roundDetail.data.fixtures) {
        if (fixture.tournament && fixture.tournament.id) {
          const tId = fixture.tournament.id;
          if (!tournamentIds.has(tId)) {
            tournamentIds.add(tId);
            manager.log(
              `   > 🎯 Discovered "${fixture.tournament.name}" (ID: ${tId}) in Round ${round.name}`
            );
          }
        }
      }
    }
  }

  if (tournamentIds.size === 0) {
    manager.log('   > No tournaments found in any round.');
    return {
      summary: 'No Biwenger tournaments were present in the season.',
      counts: { tournaments: 0 },
    };
  }

  manager.log(
    `   > Found ${tournamentIds.size} tournament(s): [${Array.from(tournamentIds).join(', ')}]`
  );

  // 2. Deep Sync: Process each tournament
  let synchronized = 0;
  for (const tId of Array.from(tournamentIds)) {
    manager.log(`   > Syncing Tournament ID: ${tId}...`);
    try {
      const tData = await getTournament(Number(tId));
      const data = tData.data;

      const status = computeTournamentStatus(data);

      // Upsert Tournament
      await tournamentMutations.upsertTournament({
        id: data.id,
        league_id: leagueId,
        name: data.name,
        type: data.config?.mode || data.type || 'unknown',
        status: status as any,
        data_json: JSON.stringify(data),
        updated_at: Math.floor(Date.now() / 1000),
      });

      // Process Rounds & Fixtures
      if (data.rounds && Array.isArray(data.rounds)) {
        const phasesMap = new Map<string, number>();
        const foundPhaseTypes = new Set<string>();
        const phasesList: any[] = [];

        // Explicit phases
        if (data.phases) {
          if (Array.isArray(data.phases)) {
            data.phases.forEach((p: any) => {
              foundPhaseTypes.add(p.type);
              phasesList.push({ type: p.type, name: p.name || p.type, order: 0 });
            });
          } else if (typeof data.phases === 'object') {
            Object.keys(data.phases).forEach((key) => {
              const p = data.phases[key];
              foundPhaseTypes.add(key);
              phasesList.push({ type: key, name: p.name || key, order: 0 });
            });
          }
        }

        // Implicit phases from rounds
        if (data.rounds && Array.isArray(data.rounds)) {
          data.rounds.forEach((r: any) => {
            if (r.type && !foundPhaseTypes.has(r.type)) {
              foundPhaseTypes.add(r.type);
              const name = r.type.charAt(0).toUpperCase() + r.type.slice(1);
              phasesList.push({ type: r.type, name, order: r.index || 0 });
            }
          });
        }

        // Upsert Phases
        for (const p of phasesList) {
          const id = await tournamentMutations.upsertPhase({
            tournament_id: data.id,
            name: p.name,
            type: p.type,
            order_index: p.order || 0,
          });
          phasesMap.set(p.type, id);
        }

        // Assign rounds to phases and upsert fixtures
        for (const round of data.rounds) {
          const phaseType = round.type || 'unknown';
          const dbPhaseId = phasesMap.get(phaseType);

          if (!dbPhaseId) {
            manager.log(
              `   > Warning: No phase ID found for type '${phaseType}' in tournament ${data.id}. Skipping round processing.`
            );
            continue;
          }

          const roundName = round.name || (round.round ? round.round.name : `Round ${round.index}`);
          const globalRoundId = round.round ? round.round.id : null;

          if (round.fixtures && Array.isArray(round.fixtures)) {
            for (const fixture of round.fixtures) {
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

      // Process Standings
      if (data.phases && typeof data.phases === 'object') {
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
                    phase_name: pKey,
                    group_name: groupName,
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
        manager.log('     ✅ Synced Standings');
      }

      manager.log(`     ✅ Synced ${data.name}`);
      synchronized++;
    } catch (e: any) {
      throw new Error(`Failed to synchronize tournament ${tId}.`, { cause: e });
    }
  }

  return {
    summary: 'Biwenger tournaments synchronized.',
    counts: { tournaments: synchronized },
  };
}

/** Compatibility export */
export const run = syncBiwengerTournaments;
