import { requireMobileRoute } from '@/lib/mobile/route-server';
import {
  fetchAllPlayAllStats,
  fetchDetailedCaptainStats,
  fetchEfficiencyStats,
  fetchHeartbreakerStats,
  fetchHeatCheckStats,
  fetchInitialSquadAnalytics,
  fetchInitialSquadStats,
  fetchPointsProgression,
  fetchReliabilityStats,
  fetchRoundWinners,
  fetchStreakStats,
} from '@/features/standings/server';
import { StandingsSectionScreen } from '@/features/standings/public';

type PageProps = { params: Promise<{ section: string }> };

async function loadSection(section: string): Promise<unknown> {
  switch (section) {
    case 'progression':
      return fetchPointsProgression(50);
    case 'rounds':
      return fetchRoundWinners(34);
    case 'draft': {
      const [analytics, stats] = await Promise.all([
        fetchInitialSquadAnalytics(),
        fetchInitialSquadStats(),
      ]);
      return { analytics, stats };
    }
    case 'form': {
      const [heat, streaks] = await Promise.all([fetchHeatCheckStats(), fetchStreakStats()]);
      return { heat, streaks };
    }
    case 'performance': {
      const [reliability, efficiency] = await Promise.all([
        fetchReliabilityStats(),
        fetchEfficiencyStats(),
      ]);
      return { reliability, efficiency };
    }
    case 'alternatives':
      return fetchAllPlayAllStats();
    case 'curiosities':
      return fetchHeartbreakerStats();
    case 'captains':
      return fetchDetailedCaptainStats();
    default:
      return [];
  }
}

export default async function StandingsSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/standings/${section}`);
  const data = await loadSection(section);

  return <StandingsSectionScreen section={section} title={route.definition.title} data={data} />;
}
