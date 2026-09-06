import 'server-only';
import { getPlayerRecentScores } from '@/features/players/server';
import { getSimpleStandings } from '@/features/standings/server';
import { readManagerSeasonStats } from '../queries/manager-stats.query';
import { readManagerSquad, readManagerPoints } from '../queries/manager-squad.query';
import { readManagerRounds } from '../queries/manager-rounds.query';
import {
  mapManagerSeasonStats,
  mapManagerSquadPlayer,
  mapManagerSquad,
  mapManagerRounds,
} from '../mappers/manager-read.mapper';
import type { ManagerStanding } from '../mappers/manager-read.mapper';

// Edge adapters retain identity validation and precedence. Reads contain fantasy
// statistics, never account credentials. No request or persistent cache is added.
export const MANAGERS_READ_POLICY = Object.freeze({
  identity: 'caller-resolved; HTTP query ID then session',
  httpCache: 'private, no-store, max-age=0, must-revalidate',
  serverCache: 'none',
  mutations: 'none',
} as const);

export interface ManagerReadDependencies {
  readStats: typeof readManagerSeasonStats;
  readSquad: typeof readManagerSquad;
  readPoints: typeof readManagerPoints;
  readRounds: typeof readManagerRounds;
  readForm: typeof getPlayerRecentScores;
  readStandings(): Promise<ManagerStanding[]>;
}

export function createManagerReadService(deps: ManagerReadDependencies) {
  async function getManagerSeasonStatsData(userId: string | number) {
    const records = await deps.readStats(userId);
    const standings = await deps.readStandings();
    return mapManagerSeasonStats(
      userId,
      records,
      standings.find((row) => String(row.user_id) === String(userId))
    );
  }
  async function getManagerSquadData(userId: string | number) {
    const { seasonId, rows } = await deps.readSquad(userId);
    const form = await deps.readForm(5);
    const lookup = new Map(form.map((row) => [row.playerId, row.recentScores]));
    const players = rows.map((row) => mapManagerSquadPlayer(row, lookup.get(Number(row.id)) || ''));
    const points = await deps.readPoints(userId, seasonId);
    const standings = await deps.readStandings();
    return mapManagerSquad(
      players,
      points,
      standings.find((row) => String(row.user_id) === String(userId))
    );
  }
  async function getManagerRoundsData(userId: string | number, limit = 100) {
    return mapManagerRounds(await deps.readRounds(String(userId), limit));
  }
  return { getManagerSeasonStatsData, getManagerSquadData, getManagerRoundsData };
}

const service = createManagerReadService({
  readStats: readManagerSeasonStats,
  readSquad: readManagerSquad,
  readPoints: readManagerPoints,
  readRounds: readManagerRounds,
  readForm: getPlayerRecentScores,
  readStandings: getSimpleStandings,
});
export const { getManagerSeasonStatsData, getManagerSquadData, getManagerRoundsData } = service;
