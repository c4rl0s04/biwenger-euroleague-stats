'use client';

import { TrendingUp, Zap, Scale } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

const UserLink = ({ user, className = '' }) => {
  if (!user || !user.id) return <span className={className}>{user?.name}</span>;

  return (
    <Link
      href={`/user/${user.id}`}
      className={`hover:underline transition-all ${className} ${getColorForUser(user.id, user.name, user.colorIndex).text}`}
    >
      {user.name}
    </Link>
  );
};

export function RecordsSection({ records }) {
  if (!records) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
      {/* Biggest Win */}
      {records.biggestWin && (
        <ElegantCard
          title="Mayor Victoria"
          icon={Scale}
          color="emerald"
          className="h-full relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300"
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

          <div className="flex flex-col items-center justify-between h-full py-4 relative z-10">
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black text-white font-display mb-2 tracking-tight drop-shadow-lg">
                +{records.biggestWin.diff}
              </span>
              <div className="text-xs font-bold text-emerald-400 mb-6 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                {records.biggestWin.score} pts
              </div>
            </div>

            <div className="flex items-center justify-between w-full px-4 mt-auto bg-black/20 rounded-xl py-3 border border-white/5">
              <div className="flex flex-col items-center gap-1 flex-1">
                <UserLink
                  user={records.biggestWin.winner}
                  className="font-bold text-sm text-center line-clamp-1 text-white"
                />
                <span className="text-[10px] font-black bg-emerald-500 text-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  WIN
                </span>
              </div>
              <span className="text-zinc-600 font-black text-xs px-2 italic opacity-50">VS</span>
              <div className="flex flex-col items-center gap-1 flex-1">
                <UserLink
                  user={records.biggestWin.loser}
                  className="font-medium text-sm text-center line-clamp-1 text-zinc-400"
                />
              </div>
            </div>
          </div>
        </ElegantCard>
      )}

      {/* Highest Scoring Match */}
      {records.highestScoring && (
        <ElegantCard
          title="Partido con Más Puntos"
          icon={Zap}
          color="amber"
          className="h-full relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300"
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

          <div className="flex flex-col items-center justify-between h-full py-4 relative z-10">
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black text-white font-display mb-2 tracking-tight drop-shadow-lg">
                {records.highestScoring.total}
              </span>
              <div className="text-xs font-bold text-amber-400 mb-6 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                Total Combinado
              </div>
            </div>

            <div className="flex items-center justify-between w-full px-4 mt-auto bg-black/20 rounded-xl py-3 border border-white/5">
              <div className="flex flex-col items-center gap-1 flex-1">
                <UserLink
                  user={records.highestScoring.match.home_user}
                  className="font-bold text-sm text-center line-clamp-1 text-white"
                />
                <span className="text-xs text-zinc-500 font-mono">
                  {records.highestScoring.match.home_score}
                </span>
              </div>
              <span className="text-amber-500 font-black text-xs px-2 italic opacity-80">+</span>
              <div className="flex flex-col items-center gap-1 flex-1">
                <UserLink
                  user={records.highestScoring.match.away_user}
                  className="font-bold text-sm text-center line-clamp-1 text-white"
                />
                <span className="text-xs text-zinc-500 font-mono">
                  {records.highestScoring.match.away_score}
                </span>
              </div>
            </div>
          </div>
        </ElegantCard>
      )}

      {/* Longest Winning Streak */}
      {records.longestStreak && (
        <ElegantCard
          title="Mejor Racha de Victorias"
          icon={TrendingUp}
          color="indigo"
          className="h-full relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300"
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

          <div className="flex flex-col items-center justify-center h-full py-4 relative z-10">
            <span className="text-6xl font-black text-white font-display mb-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              {records.longestStreak.count}
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
              Victorias Seguidas
            </span>

            <div className="mt-auto w-full bg-black/20 rounded-xl py-3 border border-white/5 flex justify-center">
              <UserLink
                user={records.longestStreak.user}
                className="text-lg font-bold flex items-center gap-2"
              />
            </div>
          </div>
        </ElegantCard>
      )}
    </div>
  );
}
