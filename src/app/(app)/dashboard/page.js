import nextDynamic from 'next/dynamic';
import { CardSkeleton } from '@/components/ui';
import { Section } from '@/components/layout';
import {
  StandingsCard,
  MySeasonCard,
  SquadValueCard,
  RecentRoundsCard,
  CaptainStatsCard,
  LeaderGapCard,
  HomeAwayCard,
  LeagueComparisonCard,
  NextMatchesCard,
} from '@/components/dashboard';

// Below-the-fold: Lazy load for better initial page load
import { fetchNextRound } from '@/lib/services';

const TopFormCard = nextDynamic(() => import('@/components/dashboard/TopFormCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

const CaptainSuggestCard = nextDynamic(() => import('@/components/dashboard/CaptainSuggestCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

const MarketOpportunitiesCard = nextDynamic(
  () => import('@/components/dashboard/MarketOpportunitiesCard'),
  {
    loading: () => <CardSkeleton />,
    ssr: true,
  }
);

const TopPlayersCard = nextDynamic(() => import('@/components/dashboard/TopPlayersCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

const MarketActivityCard = nextDynamic(() => import('@/components/dashboard/MarketActivityCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

const BirthdayCard = nextDynamic(() => import('@/components/dashboard/BirthdayCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

const NextRoundSubtitle = nextDynamic(() => import('@/components/dashboard/NextRoundSubtitle'), {
  loading: () => <span className="inline-block h-6 w-48 animate-pulse rounded bg-secondary" />,
});

const WeekMVPsCard = nextDynamic(() => import('@/components/dashboard/WeekMVPsCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

const StatsLeadersCard = nextDynamic(() => import('@/components/dashboard/StatsLeadersCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

const StreakCard = nextDynamic(() => import('@/components/dashboard/StreakCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

const IdealLineupCard = nextDynamic(() => import('@/components/dashboard/IdealLineupCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

const NextMatchesCardDynamic = nextDynamic(() => import('@/components/dashboard/NextMatchesCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  return (
    <div>
      {/* Hero Section */}
      {/* Hero Section Removed - Moved to Home Page */}

      {/* Section: Mi Temporada */}
      <Section title="Mi Temporada" delay={0} background="section-base">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MySeasonCard />
          <SquadValueCard />
          <RecentRoundsCard />
          <CaptainStatsCard />
        </div>
      </Section>

      {/* Section: Comparativa */}
      <Section title="Comparativa" delay={100} background="section-raised">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LeaderGapCard />
          <HomeAwayCard />
          <LeagueComparisonCard />
        </div>
      </Section>

      {/* Section: Próxima Jornada */}
      <Section
        title="Próxima Jornada"
        subtitle={<NextRoundSubtitle />}
        delay={200}
        background="section-base"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TopFormCard />
          <CaptainSuggestCard />
          <MarketOpportunitiesCard />
          <StandingsCard />
        </div>
        <div className="mt-4">
          <NextMatchesCardDynamic />
        </div>
      </Section>

      {/* Section: Mercado y Jugadores */}
      <Section title="Mercado y Jugadores" delay={300} background="section-raised">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopPlayersCard />
          <MarketActivityCard />
        </div>
      </Section>

      {/* Section: Rendimiento de la Liga */}
      <Section title="Rendimiento de la Liga" delay={400} background="section-base">
        {/* CHANGED: Removed 'lg:grid-cols-4' so it stays as 2 columns on large screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WeekMVPsCard />
          <StatsLeadersCard />
          <StreakCard type="hot" />
          <StreakCard type="cold" />
        </div>
      </Section>

      {/* Section: Curiosidades */}
      <Section title="Curiosidades" delay={500} background="section-raised">
        <BirthdayCard />
      </Section>
    </div>
  );
}
