import { getStandings } from '../lib/database';
import Link from 'next/link';
import { Users } from 'lucide-react';
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
import HotColdStreaksCard from '@/components/HotColdStreaksCard';
import WeekMVPsCard from '@/components/WeekMVPsCard';
import RisingStarsCard from '@/components/RisingStarsCard';

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
        <div className="lg:col-span-1 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> Clasificación
            </h2>
            <Link href="/standings" className="text-sm text-blue-400 hover:text-blue-300">Ver todo</Link>
          </div>
          <StandingsTable standings={standings} />
        </div>
      </div>

      {/* Top Players & Market Activity - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPlayersCard />
        <MarketActivityCard />
      </div>

      {/* Performance Stats - 3 Column Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WeekMVPsCard />
        <HotColdStreaksCard />
        <RisingStarsCard />
      </div>

      {/* Birthday Card - Full Width */}
      <BirthdayCard />
    </div>
  );
}
