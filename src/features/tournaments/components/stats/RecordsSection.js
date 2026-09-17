'use client';

import { TrendingUp, Zap, Scale } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { UserAvatar } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { cn } from '@/lib/utils';

const UserRecordInfo = ({ user, score, isWinner = false, className = '' }) => {
  if (!user) return null;

  const userColor = getColorForUser(user.id, user.name, user.colorIndex);

  return (
    <Link
      href={`/user/${user.id || user.name}`}
      className={cn(
        'flex flex-col items-center gap-2 group/user p-2 rounded-xl transition-all hover:bg-white/5',
        className
      )}
    >
      <UserAvatar
        src={user.icon || user.image}
        alt={user.name}
        size={40}
        className={cn(
          'ring-2 ring-offset-2 ring-offset-black transition-all group-hover/user:ring-4',
          isWinner ? 'ring-emerald-500/50' : 'ring-white/10'
        )}
      />
      <div className="flex flex-col items-center">
        <span
          className={cn('text-xs font-bold truncate max-w-[80px] md:max-w-[100px]', userColor.text)}
        >
          {user.name}
        </span>
        {score !== undefined && (
          <span className="text-[10px] font-mono text-zinc-500">{score} pts</span>
        )}
      </div>
    </Link>
  );
};

export function RecordsSection({ records }) {
  if (!records) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in-up">
      {/* Biggest Win */}
      {records.biggestWin && (
        <ElegantCard
          title="Mayor Victoria"
          icon={Scale}
          color="emerald"
          className="h-full group hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-500"
        >
          <div className="flex flex-col items-center justify-center py-6 h-full">
            <div className="flex flex-col items-center mb-8">
              <span className="text-7xl font-display font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                +{records.biggestWin.diff}
              </span>
              <span className="text-xs font-black text-emerald-500 uppercase tracking-widest mt-1">
                DIFERENCIA MÁXIMA
              </span>
              <div className="mt-3 flex items-center justify-center">
                <span className="text-3xl font-display text-emerald-400 drop-shadow-md tracking-wider">
                  {records.biggestWin.score}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full mt-auto">
              <UserRecordInfo user={records.biggestWin.winner} isWinner={true} className="w-full" />
              <div className="flex flex-col items-center justify-center pt-2">
                <span className="text-[10px] font-black text-zinc-700 italic px-2">VS</span>
              </div>
              <UserRecordInfo user={records.biggestWin.loser} isWinner={false} className="w-full" />
            </div>
          </div>
        </ElegantCard>
      )}

      {/* Highest Scoring Match */}
      {records.highestScoring && (
        <ElegantCard
          title="Match Más Anotado"
          icon={Zap}
          color="amber"
          className="h-full group hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-500"
        >
          <div className="flex flex-col items-center justify-center py-6 h-full">
            <div className="flex flex-col items-center mb-10">
              <span className="text-7xl font-display font-black text-amber-400 tracking-tighter drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                {records.highestScoring.total}
              </span>
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest mt-1">
                TOTAL COMBINADO
              </span>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-3xl font-display text-amber-400 drop-shadow-md tracking-widest">
                  {records.highestScoring.match.home_score}
                </span>
                <span className="text-amber-600/60 font-display text-xl">+</span>
                <span className="text-3xl font-display text-amber-400 drop-shadow-md tracking-widest">
                  {records.highestScoring.match.away_score}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full mt-auto">
              <UserRecordInfo user={records.highestScoring.match.home_user} className="w-full" />
              <div className="flex flex-col items-center justify-center pt-2">
                <span className="text-[10px] font-black text-zinc-700 italic px-2">VS</span>
              </div>
              <UserRecordInfo user={records.highestScoring.match.away_user} className="w-full" />
            </div>
          </div>
        </ElegantCard>
      )}

      {/* Longest Winning Streak */}
      {records.longestStreak && (
        <ElegantCard
          title="Racha Histórica"
          icon={TrendingUp}
          color="indigo"
          className="h-full group hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500"
        >
          <div className="flex flex-col items-center justify-center py-6 h-full">
            <div className="flex flex-col items-center mb-10">
              <span className="text-8xl font-display font-black text-indigo-400 tracking-tighter drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                {records.longestStreak.count}
              </span>
              <span className="text-xs font-black text-indigo-500 uppercase tracking-widest mt-1">
                VICTORIAS SEGUIDAS
              </span>
            </div>

            <div className="w-full mt-auto">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                  PERTENECE A
                </span>
                <UserRecordInfo
                  user={records.longestStreak.user}
                  className="!flex-row !gap-4 !px-6"
                />
              </div>
            </div>
          </div>
        </ElegantCard>
      )}
    </div>
  );
}
