import 'server-only';

import { tournamentId, fixtureTournamentId } from '../../validation/tournament-input';
import {
  mapTournament,
  mapTournamentStanding,
  mapTournamentFixture,
  mapManagerTournament,
} from '../mappers/tournament.mapper';
import { mapManagerParticipation } from '../mappers/manager-participation.mapper';
import {
  readTournaments,
  readTournamentById,
  readTournamentStandings,
  readTournamentFixtures,
  readManagerTournaments,
} from '../queries/tournament.query';
import type {
  TournamentRecord,
  TournamentStandingRecord,
  TournamentFixtureRecord,
  ManagerTournamentRecord,
} from '../queries/tournament.records';

export const TOURNAMENT_READ_POLICY = Object.freeze({
  access: 'competition reads; manager identity supplied by caller',
  serverCache: 'none',
  httpCache: 'no owned HTTP routes; existing page/caller policy unchanged',
  mutations: 'none',
} as const);

export interface TournamentReadDependencies {
  all(): Promise<TournamentRecord[]>;
  detail(id: number): Promise<TournamentRecord | null>;
  standings(id: number | null): Promise<TournamentStandingRecord[]>;
  fixtures(id: number | null): Promise<TournamentFixtureRecord[]>;
  participation(userId: string | number): Promise<ManagerTournamentRecord[]>;
}

export function createTournamentReadService(deps: TournamentReadDependencies) {
  async function getTournaments() {
    return (await deps.all()).map(mapTournament);
  }
  async function getTournamentById(id: number) {
    const row = await deps.detail(id);
    return row ? mapTournament(row) : null;
  }
  async function getTournamentStandings(id: number | null) {
    return (await deps.standings(id)).map(mapTournamentStanding);
  }
  async function getTournamentFixtures(id: number | null) {
    return (await deps.fixtures(id)).map(mapTournamentFixture);
  }
  async function getUserTournaments(userId: string | number) {
    return (await deps.participation(userId)).map(mapManagerTournament);
  }
  async function getAllTournaments() {
    const all = await getTournaments();
    return {
      active: all.filter((t) => t.status === 'active'),
      finished: all.filter((t) => t.status !== 'active'),
      all,
    };
  }
  async function getTournamentDetails(id: string | number) {
    return getTournamentById(tournamentId(id));
  }
  async function getStandings(id: string | number) {
    return getTournamentStandings(tournamentId(id));
  }
  async function getFixtures(id: string | number | null = null) {
    return getTournamentFixtures(fixtureTournamentId(id));
  }
  async function fetchUserTournaments(userId: string | number) {
    return mapManagerParticipation(await getUserTournaments(userId), userId);
  }
  return {
    getTournaments,
    getTournamentById,
    getTournamentStandings,
    getTournamentFixtures,
    getUserTournaments,
    getAllTournaments,
    getTournamentDetails,
    getStandings,
    getFixtures,
    fetchUserTournaments,
  };
}

export const {
  getTournaments,
  getTournamentById,
  getTournamentStandings,
  getTournamentFixtures,
  getUserTournaments,
  getAllTournaments,
  getTournamentDetails,
  getStandings,
  getFixtures,
  fetchUserTournaments,
} = createTournamentReadService({
  all: readTournaments,
  detail: readTournamentById,
  standings: readTournamentStandings,
  fixtures: readTournamentFixtures,
  participation: readManagerTournaments,
});
