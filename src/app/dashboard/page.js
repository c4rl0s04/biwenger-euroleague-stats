import nextDynamic from 'next/dynamic';
import Link from 'next/link';
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

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Personal Stats Row */}
      <FadeIn delay={0}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MySeasonCard />
          <SquadValueCard />
          <RecentRoundsCard />
          <CaptainStatsCard />
        </div>
      </FadeIn>

      {/* Secondary Stats Row */}
      <FadeIn delay={100}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LeaderGapCard />
          <HomeAwayCard />
          <LeagueComparisonCard />
        </div>
      </FadeIn>

      {/* Main Content: Next Round & Standings */}
      <FadeIn delay={200}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Next Round Card - Enhanced Component */}
          <NextRoundCard />

          {/* Standings Preview */}
          <StandingsCard />
        </div>
      </FadeIn>

      {/* Top Players & Market Activity - Side by Side */}
      <FadeIn delay={300}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopPlayersCard />
          <MarketActivityCard />
        </div>
      </FadeIn>

      {/* Performance Stats - 4 Column Row */}
      <FadeIn delay={400}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <WeekMVPsCard />
          <IdealLineupCard />
          <StreakCard type="hot" />
          <StreakCard type="cold" />
        </div>
      </FadeIn>

      {/* Birthday Card - Full Width */}
      <FadeIn delay={500}>
        <BirthdayCard />
      </FadeIn>
    </div>
  );
}
