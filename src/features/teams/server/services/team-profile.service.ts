import { cache } from 'react';

import type { MatchScheduleViewModel } from '@/features/matches/public';
import { getSeasonScheduleData } from '@/features/matches/server';

import type { TeamProfileViewModel } from '../../models/team-profile';
import { parseTeamId } from '../../validation/team-profile-input';
import {
  mapTeamProfileDetails,
  mapTeamProfileMatches,
  mapTeamRoster,
} from '../mappers/team-profile.mapper';
import {
  findTeamProfileDetails,
  listTeamRoster,
  type TeamProfileDetailsQueryResult,
  type TeamRosterRow,
} from '../queries/team-profile.query';

export const TEAM_PROFILE_HTTP_CACHE_SECONDS = 300;
export const TEAM_PROFILE_ACCESS_POLICY = Object.freeze({
  read: 'public',
  mutations: 'none',
} as const);

export interface TeamProfileServiceDependencies {
  findDetails(teamId: number): Promise<TeamProfileDetailsQueryResult | null>;
  listRoster(teamId: number): Promise<TeamRosterRow[]>;
  getSeasonSchedule(): Promise<MatchScheduleViewModel[]>;
  now(): Date;
}

export function createTeamProfileService(dependencies: TeamProfileServiceDependencies) {
  async function getTeamProfileData(teamIdInput: unknown): Promise<TeamProfileViewModel | null> {
    const teamId = parseTeamId(teamIdInput);
    if (teamId == null) return null;

    const [details, rosterRows, teamSchedule] = await Promise.all([
      dependencies.findDetails(teamId),
      dependencies.listRoster(teamId),
      dependencies.getSeasonSchedule(),
    ]);
    if (!details) return null;

    return {
      ...mapTeamProfileDetails(details),
      roster: mapTeamRoster(rosterRows),
      ...mapTeamProfileMatches(teamSchedule, teamId, dependencies.now()),
    };
  }

  return { getTeamProfileData };
}

const teamProfileService = createTeamProfileService({
  findDetails: findTeamProfileDetails,
  listRoster: listTeamRoster,
  getSeasonSchedule: getSeasonScheduleData,
  now: () => new Date(),
});

// The route and pages remain force-dynamic. React cache only deduplicates reads
// within a single server request and does not change cross-request freshness.
export const getTeamProfileData = cache(teamProfileService.getTeamProfileData);
