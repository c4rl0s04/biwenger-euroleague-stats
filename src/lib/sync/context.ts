import type { EuroleagueClient } from '../api/euroleague/client';
import type { OfficialScheduleGame } from '../api/euroleague/types';
import type { pool } from '../db/client';
import type { BiwengerRound } from './rounds';
import type { SyncSeasonContext } from './season-guard';

export interface BiwengerCompetitionSnapshot {
  raw: unknown;
  players: Record<string, any>;
  teams: Record<string, any>;
  rounds: BiwengerRound[];
}

export interface SyncExecutionContext {
  db: typeof pool | null;
  seasonId?: string;
  season?: SyncSeasonContext;
  euroleague: EuroleagueClient;
  biwenger?: BiwengerCompetitionSnapshot;
  officialSchedule?: OfficialScheduleGame[];
}

export function parseBiwengerCompetition(raw: any): BiwengerCompetitionSnapshot {
  const payload = raw?.data?.data || raw?.data || raw || {};
  const season = raw?.data?.season || payload?.season || {};
  const players = payload.players;
  const teams = payload.teams;
  const rounds = raw?.data?.rounds || season.rounds || payload.rounds;

  if (!players || typeof players !== 'object') {
    throw new Error('Biwenger competition payload contains no player catalogue.');
  }
  if (!teams || typeof teams !== 'object') {
    throw new Error('Biwenger competition payload contains no team catalogue.');
  }
  if (!Array.isArray(rounds)) {
    throw new Error('Biwenger competition payload contains no rounds.');
  }

  return { raw, players, teams, rounds };
}
