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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Biggest Win */}
      {records.biggestWin && (
        <ElegantCard title="Mayor Victoria" icon={Scale} color="emerald" className="h-full">
          <div className="flex flex-col items-center justify-between h-full py-2">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-white font-display mb-1 tracking-tight">
                +{records.biggestWin.diff} pts
              </span>
              <div className="text-sm font-medium text-emerald-400 mb-4 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20">
                {records.biggestWin.score}
              </div>
            </div>

            <div className="flex items-center justify-between w-full px-2 mt-auto">
              <div className="flex flex-col items-center gap-1 flex-1">
                <UserLink
                  user={records.biggestWin.winner}
                  className="font-bold text-sm text-center line-clamp-1"
                />
                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-mono">
                  WIN
                </span>
              </div>
              <span className="text-zinc-700 font-bold text-xs px-2 italic">VS</span>
              <div className="flex flex-col items-center gap-1 flex-1">
                <UserLink
                  user={records.biggestWin.loser}
                  className="font-bold text-sm text-center line-clamp-1"
                />
              </div>
            </div>
          </div>
        </ElegantCard>
      )}

      {/* Highest Scoring Match */}
      {records.highestScoring && (
        <ElegantCard title="Partido con Más Puntos" icon={Zap} color="amber" className="h-full">
          <div className="flex flex-col items-center justify-between h-full py-2">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-white font-display mb-1 tracking-tight">
                {records.highestScoring.total} pts
              </span>
              <div className="text-sm font-medium text-amber-400 mb-4 bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/20">
                {records.highestScoring.score}
              </div>
            </div>

            <div className="flex items-center justify-between w-full px-2 mt-auto">
              <div className="flex flex-col items-center gap-1 flex-1">
                <UserLink
                  user={records.highestScoring.match.home_user}
                  className="font-bold text-sm text-center line-clamp-1"
                />
              </div>
              <span className="text-zinc-700 font-bold text-xs px-2 italic">VS</span>
              <div className="flex flex-col items-center gap-1 flex-1">
                <UserLink
                  user={records.highestScoring.match.away_user}
                  className="font-bold text-sm text-center line-clamp-1"
                />
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
          className="h-full"
        >
          <div className="flex flex-col items-center justify-center h-full py-2">
            <span className="text-5xl font-black text-white font-display mb-2 drop-shadow-lg">
              {records.longestStreak.count}
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
              Consecutivas
            </span>

            <div className="mt-auto pt-2">
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
