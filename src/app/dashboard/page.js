import nextDynamic from 'next/dynamic';
import { CardSkeleton, FadeIn } from '@/components/ui';
import {
  StandingsCard,
  MySeasonCard,
  SquadValueCard,
  RecentRoundsCard,
  CaptainStatsCard,
  LeaderGapCard,
  HomeAwayCard,
  LeagueComparisonCard,
} from '@/components/dashboard';

// Below-the-fold: Lazy load for better initial page load
const NextRoundCard = nextDynamic(() => import('@/components/dashboard/NextRoundCard'), {
  loading: () => <CardSkeleton />,
  ssr: true,
});

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

const WeekMVPsCard = nextDynamic(() => import('@/components/dashboard/WeekMVPsCard'), {
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

export const dynamic = 'force-dynamic';

// Section component for consistent heading styles
function Section({ title, children, delay = 0 }) {
  return (
    <FadeIn delay={delay}>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">{title}</h2>
        {children}
      </section>
    </FadeIn>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Section: Mi Temporada */}
      <Section title="Mi Temporada" delay={0}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MySeasonCard />
          <SquadValueCard />
          <RecentRoundsCard />
          <CaptainStatsCard />
        </div>
      </Section>

      {/* Section: Comparativa */}
      <Section title="Comparativa" delay={100}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LeaderGapCard />
          <HomeAwayCard />
          <LeagueComparisonCard />
        </div>
      </Section>

      {/* Section: Próxima Jornada */}
      <Section title="Próxima Jornada" delay={200}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <NextRoundCard />
          <StandingsCard />
        </div>
      </Section>

      {/* Section: Mercado y Jugadores */}
      <Section title="Mercado y Jugadores" delay={300}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopPlayersCard />
          <MarketActivityCard />
        </div>
      </Section>

      {/* Section: Rendimiento de la Liga */}
      <Section title="Rendimiento de la Liga" delay={400}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <WeekMVPsCard />
          <IdealLineupCard />
          <StreakCard type="hot" />
          <StreakCard type="cold" />
        </div>
      </Section>

      {/* Section: Curiosidades */}
      <Section title="Curiosidades" delay={500}>
        <BirthdayCard />
      </Section>
    </div>
  );
}
