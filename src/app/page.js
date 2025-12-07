import { getStandings, getLastRoundWinner } from '../lib/database';
import Link from 'next/link';
import { Users, Trophy } from 'lucide-react';
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
          
          {/* League Insights Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/50">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-800/30 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Media Puntos</div>
                <div className="text-lg font-bold text-slate-300">
                  {standings.length > 0 ? Math.round(standings.reduce((acc, u) => acc + u.total_points, 0) / standings.length) : 0}
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Valor Liga</div>
                <div className="text-lg font-bold text-blue-400">
                  {(standings.reduce((acc, u) => acc + u.team_value, 0) / 1000000).toFixed(1)}M€
                </div>
              </div>
            </div>
            
            {(() => {
              const lastWinner = getLastRoundWinner();
              return lastWinner ? (
                <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-3 border border-yellow-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Ganador {lastWinner.round_name}</span>
                    <Trophy className="w-3 h-3 text-yellow-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {lastWinner.icon ? (
                        <img src={lastWinner.icon} alt={lastWinner.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">{lastWinner.name.charAt(0)}</div>
                      )}
                      <span className="text-sm font-medium text-white">{lastWinner.name}</span>
                    </div>
                    <div className="text-sm font-bold text-yellow-500">
                      {lastWinner.points} pts
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
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
