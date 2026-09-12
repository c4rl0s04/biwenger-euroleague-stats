import 'server-only';
import type { StandingsOverviewModel, StandingsSectionModel } from '../../models/screens';
import { getFullStandings, getLeagueOverview } from './base-standings.service';
import { fetchAllPlayAllStats } from './all-play-all.service';
import {
  fetchDetailedCaptainStats,
  fetchEfficiencyStats,
  fetchHeartbreakerStats,
} from './curiosities.service';
import { fetchHeatCheckStats, fetchReliabilityStats } from './performance.service';
import { fetchInitialSquadAnalytics, fetchInitialSquadStats } from './draft.service';
import { fetchPointsProgression, fetchRoundWinners, fetchStreakStats } from './progression.service';

// Page protection remains the framework guard's responsibility. Public fantasy reads,
// no new service cache; constituent query caches retain their existing policy.
export async function getStandingsOverview(): Promise<StandingsOverviewModel> {
  const [standings, leagueTotals] = await Promise.all([getFullStandings(), getLeagueOverview()]);
  return { standings, leagueTotals };
}

interface SectionProjection {
  user_id: string;
  name?: string | null;
  user_name?: string | null;
  round_name?: string | null;
  points?: number | null;
  wins?: number;
  count?: number;
}

// Preserve the old renderer's first-array selection, 20-row cap, nullish title
// precedence, Spanish number formatting, and captain-only links.
function sectionRows(records: SectionProjection[], captains = false): StandingsSectionModel {
  return {
    rows: records.slice(0, 20).map((record, index) => {
      const value = record.points ?? record.wins ?? record.count;
      return {
        key: String(record.user_id ?? index),
        title: String(
          record.name ?? record.user_name ?? record.round_name ?? `Registro ${index + 1}`
        ),
        value: value == null ? null : Number(value).toLocaleString('es-ES'),
        href: captains && record.user_id != null ? `/user/${record.user_id}` : null,
      };
    }),
  };
}

export async function getStandingsSection(section: string): Promise<StandingsSectionModel> {
  switch (section) {
    case 'progression':
      return sectionRows(await fetchPointsProgression(50));
    case 'rounds':
      return sectionRows(await fetchRoundWinners(34));
    case 'draft': {
      const [analytics] = await Promise.all([
        fetchInitialSquadAnalytics(),
        fetchInitialSquadStats(),
      ]);
      return sectionRows(analytics);
    }
    case 'form': {
      const [heat] = await Promise.all([fetchHeatCheckStats(), fetchStreakStats()]);
      return sectionRows(heat);
    }
    case 'performance': {
      const [reliability] = await Promise.all([fetchReliabilityStats(), fetchEfficiencyStats()]);
      return sectionRows(reliability);
    }
    case 'alternatives':
      return sectionRows(await fetchAllPlayAllStats());
    case 'curiosities':
      return sectionRows(await fetchHeartbreakerStats());
    case 'captains':
      return sectionRows(await fetchDetailedCaptainStats(), true);
    default:
      return { rows: [] };
  }
}
