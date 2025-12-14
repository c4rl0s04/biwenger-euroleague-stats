import { getStandings } from '@/lib/db';
import Link from 'next/link';
import StandingsCard from '@/components/StandingsCard';
import StandingsTable from '@/components/StandingsTable';
import MySeasonCard from '@/components/MySeasonCard';
import SquadValueCard from '@/components/SquadValueCard';
import RecentRoundsCard from '@/components/RecentRoundsCard';
import CaptainStatsCard from '@/components/CaptainStatsCard';
import LeaderGapCard from '@/components/LeaderGapCard';
import HomeAwayCard from '@/components/HomeAwayCard';
import LeagueComparisonCard from '@/components/LeagueComparisonCard';
import NextRoundCard from '@/components/NextRoundCard';
import TopPlayersCard from '@/components/TopPlayersCard';
import MarketActivityCard from '@/components/MarketActivityCard';
import BirthdayCard from '@/components/BirthdayCard';
import HotStreaksCard from '@/components/HotStreaksCard';
import ColdStreaksCard from '@/components/ColdStreaksCard';
import IdealLineupCard from '@/components/IdealLineupCard';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const standings = getStandings();

  return (
    <div className="space-y-6">
      {/* Personal Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MySeasonCard />
        <SquadValueCard />
        <RecentRoundsCard />
        <CaptainStatsCard />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LeaderGapCard />
        <HomeAwayCard />
        <LeagueComparisonCard />
      </div>

      {/* Main Content: Next Round & Standings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Round Card - Enhanced Component */}
        <NextRoundCard />

        {/* Standings Preview */}
        <StandingsCard standings={standings} />
      </div>

      {/* Top Players & Market Activity - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPlayersCard />
        <MarketActivityCard />
      </div>

      {/* Performance Stats - 4 Column Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <WeekMVPsCard />
        <IdealLineupCard />
        <HotStreaksCard />
        <ColdStreaksCard />
      </div>

      {/* Birthday Card - Full Width */}
      <BirthdayCard />
    </div>
  );
}