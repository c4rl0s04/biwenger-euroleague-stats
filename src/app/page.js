import { getTopPlayers, getStandings } from '../lib/database';
import Link from 'next/link';
import { TrendingUp, Users } from 'lucide-react';
import StandingsTable from '@/components/StandingsTable';
import MySeasonCard from '@/components/MySeasonCard';
import SquadValueCard from '@/components/SquadValueCard';
import RecentRoundsCard from '@/components/RecentRoundsCard';
import CaptainStatsCard from '@/components/CaptainStatsCard';
import LeaderGapCard from '@/components/LeaderGapCard';
import HomeAwayCard from '@/components/HomeAwayCard';
import LeagueComparisonCard from '@/components/LeagueComparisonCard';
import NextRoundCard from '@/components/NextRoundCard';
import RecentActivityCard from '@/components/RecentActivityCard';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const topPlayers = getTopPlayers(5);
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

      {/* Top Players */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" /> Top Jugadores
          </h2>
          <Link href="/players" className="text-sm text-green-400 hover:text-green-300">Ver todos</Link>
        </div>
        <div className="space-y-4">
          {topPlayers.map((player, index) => (
            <div key={player.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg font-bold text-white border-2 border-slate-600">
                {index + 1}
              </div>
              <div className="flex-grow min-w-0">
                <div className="font-medium text-white truncate">{player.name}</div>
                <div className="text-xs text-slate-400">{player.team} · {player.position}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-400">{player.points} pts</div>
                <div className="text-xs text-slate-500">{player.average} avg</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity - Enhanced Component */}
      <RecentActivityCard />
    </div>
  );
}
