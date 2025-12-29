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

/**
 * Section component with split-color title and background support
 * Title format: "MI TEMPORADA" -> "MI" in white, "TEMPORADA" in primary (orange)
 */
function Section({ title, children, delay = 0, background = '' }) {
  // Split title into first word and rest
  const words = title.split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');

  return (
    <FadeIn delay={delay}>
      <section className={`${background} px-4 sm:px-6 lg:px-8 py-10`}>
        <div className="max-w-7xl mx-auto space-y-6">
          <h2 className="font-display text-4xl tracking-wide">
            <span className="text-foreground">{firstWord}</span>
            {restWords && <span className="text-primary"> {restWords}</span>}
          </h2>
          {children}
        </div>
      </section>
    </FadeIn>
  );
}

export default function Dashboard() {
  return (
    <div>
      {/* Hero Section */}
      <section className="section-sunken px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-gradient text-5xl sm:text-6xl lg:text-7xl tracking-wide mb-4">
            BIWENGER STATS
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Análisis avanzado de tu liga de Fantasy Euroliga
          </p>
        </div>
      </section>

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
      <Section title="Próxima Jornada" delay={200} background="section-base">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <NextRoundCard />
          <StandingsCard />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <WeekMVPsCard />
          <IdealLineupCard />
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
