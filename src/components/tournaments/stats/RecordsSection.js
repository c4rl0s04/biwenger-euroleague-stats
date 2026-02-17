'use client';

import { TrendingUp, Zap, Scale } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

export function RecordsSection({ records }) {
  if (!records) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Biggest Win */}
      {records.biggestWin && (
        <ElegantCard title="Mayor Victoria" icon={Scale} color="emerald">
          <div className="flex flex-col items-center justify-center flex-1 py-2">
            <span className="text-3xl font-black text-white font-display mb-1">
              +{records.biggestWin.diff} pts
            </span>
            <div className="text-sm font-medium text-zinc-400 mb-3 bg-zinc-900/50 px-3 py-1 rounded-full border border-white/5">
              {records.biggestWin.score}
            </div>

            <div className="flex items-center gap-3 text-xs w-full justify-center">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`font-bold ${getColorForUser(null, null, records.biggestWin.winner.colorIndex).text}`}
                >
                  {records.biggestWin.winner.name}
                </span>
              </div>
              <span className="text-zinc-600 font-bold text-[10px] uppercase">VS</span>
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`font-bold ${getColorForUser(null, null, records.biggestWin.loser.colorIndex).text}`}
                >
                  {records.biggestWin.loser.name}
                </span>
              </div>
            </div>
          </div>
        </ElegantCard>
      )}

      {/* Highest Scoring Match */}
      {records.highestScoring && (
        <ElegantCard title="Más Puntos (Partido)" icon={Zap} color="amber">
          <div className="flex flex-col items-center justify-center flex-1 py-2">
            <span className="text-3xl font-black text-white font-display mb-1">
              {records.highestScoring.total} pts
            </span>
            <div className="text-sm font-medium text-zinc-400 mb-3 bg-zinc-900/50 px-3 py-1 rounded-full border border-white/5">
              {records.highestScoring.score}
            </div>
            <div className="flex items-center gap-3 text-xs w-full justify-center">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`font-bold ${getColorForUser(null, null, records.highestScoring.match.home_user_color).text}`}
                >
                  {records.highestScoring.match.home_user_name}
                </span>
              </div>
              <span className="text-zinc-600 font-bold text-[10px] uppercase">VS</span>
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`font-bold ${getColorForUser(null, null, records.highestScoring.match.away_user_color).text}`}
                >
                  {records.highestScoring.match.away_user_name}
                </span>
              </div>
            </div>
          </div>
        </ElegantCard>
      )}

      {/* Longest Winning Streak */}
      {records.longestStreak && (
        <ElegantCard title="Mejor Racha" icon={TrendingUp} color="indigo">
          <div className="flex flex-col items-center justify-center flex-1 py-2">
            <span className="text-3xl font-black text-white font-display mb-1">
              {records.longestStreak.count}
            </span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">
              Victorias Consecutivas
            </span>

            <Link
              href={`/user/${records.longestStreak.user.id}`}
              className={`text-sm font-bold hover:underline flex items-center gap-2 ${getColorForUser(records.longestStreak.user.id, records.longestStreak.user.name, records.longestStreak.user.colorIndex).text}`}
            >
              {records.longestStreak.user.name}
            </Link>
          </div>
        </ElegantCard>
      )}
    </div>
  );
}
