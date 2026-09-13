import 'server-only';
import type {
  TeamMatchCounts,
  TeamQualificationProbabilities,
} from '../../models/team-competition';
import {
  readTeamMatchCount,
  readAllTeamMatchCounts,
  readTeamCompetitionFacts,
} from '../queries/team-competition.query';
import {
  mapTeamMatchCounts,
  mapTeamQualificationProbabilities,
} from '../mappers/team-competition.mapper';

/** Public sporting metrics; no session identity or added request/persistent cache. */
export const TEAM_COMPETITION_READ_POLICY = Object.freeze({
  access: 'public',
  serverCache: 'none',
} as const);

export async function getTeamMatchesCount(teamId: number | string): Promise<number> {
  const numericTeamId = Number(teamId);
  if (isNaN(numericTeamId)) return 0;
  const count = await readTeamMatchCount(numericTeamId);
  return parseInt(String(count || '0'), 10);
}

export async function getAllTeamMatchesCount(): Promise<TeamMatchCounts> {
  return mapTeamMatchCounts(await readAllTeamMatchCounts());
}

export async function getAllTeamsPlayoffProbabilities(): Promise<TeamQualificationProbabilities> {
  return mapTeamQualificationProbabilities(await readTeamCompetitionFacts());
}

export async function getTeamPlayoffProbability(teamId: number | string): Promise<number> {
  const numericTeamId = Number(teamId);
  if (isNaN(numericTeamId)) return 50;
  const probabilities = await getAllTeamsPlayoffProbabilities();
  return probabilities[numericTeamId] !== undefined ? probabilities[numericTeamId] : 50;
}
