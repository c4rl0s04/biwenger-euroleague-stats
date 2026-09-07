import 'server-only';
import { fetchUserTournaments } from '@/features/tournaments/server';
import {
  getManagerSeasonStatsData,
  getManagerSquadData,
  getManagerRoundsData,
} from './manager-read.service';
import { getManagerContributorsData } from './manager-contributors.service';
import {
  mapManagerProfileRows,
  mapManagerProfileTournaments,
} from '../mappers/manager-profile.mapper';
import type {
  ManagerProfilePresentation,
  ManagerProfileResult,
  ManagerProfileSection,
} from '../../models/manager-profile';

export const MANAGER_PROFILE_POLICY = Object.freeze({
  access:
    'existing protected app layout/proxy; route ID identifies fantasy manager, never account identity',
  validation:
    'forward route ID unchanged; section allowlist and desktop redirects remain in requireMobileRoute',
  cache: 'no added cache; main page remains force-dynamic; owning read freshness unchanged',
  errors:
    'read failures propagate to existing framework boundary; main missing manager remains rendered 200',
} as const);

export interface ManagerProfileDependencies {
  stats: typeof getManagerSeasonStatsData;
  squad: typeof getManagerSquadData;
  rounds: typeof getManagerRoundsData;
  tournaments: typeof fetchUserTournaments;
  contributors: typeof getManagerContributorsData;
}

export function createManagerProfileService(deps: ManagerProfileDependencies) {
  async function getManagerProfile(
    id: string,
    presentation: ManagerProfilePresentation
  ): Promise<ManagerProfileResult> {
    if (presentation === 'phone') {
      const [stats, squad] = await Promise.all([deps.stats(id), deps.squad(id)]);
      if (!stats || !stats.name || stats.name === 'Desconocido')
        return { kind: 'missing', presentation };
      return { kind: 'phone', data: { stats, squad } };
    }
    const [stats, squad, recentRounds, tournaments, topContributors] = await Promise.all([
      deps.stats(id),
      deps.squad(id),
      deps.rounds(id, 100),
      deps.tournaments(id),
      deps.contributors(id),
    ]);
    if (!stats || !stats.name || stats.name === 'Desconocido')
      return { kind: 'missing', presentation };
    return {
      kind: 'desktop',
      data: {
        stats,
        squad,
        recentRounds,
        tournaments: mapManagerProfileTournaments(tournaments),
        topContributors,
      },
    };
  }

  /** Called only after the existing mobile route guard. Keep the legacy default
   * competition branch; do not independently tighten section or ID contracts. */
  async function getManagerProfileSection(
    id: string,
    section: string
  ): Promise<ManagerProfileSection> {
    const stats = await deps.stats(id);
    const data =
      section === 'season'
        ? stats
        : section === 'squad'
          ? await deps.squad(id)
          : section === 'evolution'
            ? await deps.rounds(id, 100)
            : section === 'contributors'
              ? await deps.contributors(id)
              : await deps.tournaments(id);
    return {
      context: stats.name,
      rows: mapManagerProfileRows(
        data,
        section === 'squad' || section === 'contributors' ? '/player' : undefined
      ),
    };
  }
  return { getManagerProfile, getManagerProfileSection };
}

export const { getManagerProfile, getManagerProfileSection } = createManagerProfileService({
  stats: getManagerSeasonStatsData,
  squad: getManagerSquadData,
  rounds: getManagerRoundsData,
  tournaments: fetchUserTournaments,
  contributors: getManagerContributorsData,
});
