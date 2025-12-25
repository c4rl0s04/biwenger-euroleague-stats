import Link from 'next/link';
import StandingsCard from '@/components/dashboard/StandingsCard';

import MySeasonCard from '@/components/dashboard/MySeasonCard';
import SquadValueCard from '@/components/dashboard/SquadValueCard';
import RecentRoundsCard from '@/components/dashboard/RecentRoundsCard';
import CaptainStatsCard from '@/components/dashboard/CaptainStatsCard';
import LeaderGapCard from '@/components/dashboard/LeaderGapCard';
import HomeAwayCard from '@/components/dashboard/HomeAwayCard';
import LeagueComparisonCard from '@/components/dashboard/LeagueComparisonCard';
import NextRoundCard from '@/components/dashboard/NextRoundCard';
import TopPlayersCard from '@/components/dashboard/TopPlayersCard';
import MarketActivityCard from '@/components/dashboard/MarketActivityCard';
import BirthdayCard from '@/components/dashboard/BirthdayCard';
import WeekMVPsCard from '@/components/dashboard/WeekMVPsCard';
import StreakCard from '@/components/dashboard/StreakCard';
import IdealLineupCard from '@/components/dashboard/IdealLineupCard';

import FadeIn from '@/components/ui/FadeIn';

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