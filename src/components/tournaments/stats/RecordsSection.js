'use client';

import { Trophy, TrendingUp, Zap, Scale } from 'lucide-react';
import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';

function RecordCard({ title, icon: Icon, color, children }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-card/20 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center gap-2 group hover:bg-white/5 transition-colors">
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 ${color}`}
      />
      <div className={`p-2 rounded-full bg-white/5 mb-1 text-white`}>
        <Icon size={20} />
      </div>
      <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

export function RecordsSection({ records }) {
  if (!records) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Biggest Win */}
      {records.biggestWin && (
        <RecordCard title="Mayor Victoria" icon={Scale} color="bg-emerald-500">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-white font-display">
              +{records.biggestWin.diff} pts
            </span>
            <div className="text-sm font-medium text-zinc-300 mt-1">{records.biggestWin.score}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
              <span
                className={getColorForUser(null, null, records.biggestWin.winner.colorIndex).text}
              >
                {records.biggestWin.winner.name}
              </span>
              <span>vs</span>
              <span
                className={getColorForUser(null, null, records.biggestWin.loser.colorIndex).text}
              >
                {records.biggestWin.loser.name}
              </span>
            </div>
          </div>
        </RecordCard>
      )}

      {/* Highest Scoring Match */}
      {records.highestScoring && (
        <RecordCard title="Más Puntos (Partido)" icon={Zap} color="bg-amber-500">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-white font-display">
              {records.highestScoring.total} pts
            </span>
            <div className="text-sm font-medium text-zinc-300 mt-1">
              {records.highestScoring.score}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
              <span
                className={
                  getColorForUser(null, null, records.highestScoring.match.home_user_color).text
                }
              >
                {records.highestScoring.match.home_user_name}
              </span>
              <span>vs</span>
              <span
                className={
                  getColorForUser(null, null, records.highestScoring.match.away_user_color).text
                }
              >
                {records.highestScoring.match.away_user_name}
              </span>
            </div>
          </div>
        </RecordCard>
      )}

      {/* Longest Winning Streak */}
      {records.longestStreak && (
        <RecordCard title="Mejor Racha" icon={TrendingUp} color="bg-indigo-500">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-white font-display">
              {records.longestStreak.count} Victorias
            </span>
            <Link
              href={`/user/${records.longestStreak.user.id}`}
              className={`text-sm font-medium mt-1 hover:underline ${getColorForUser(records.longestStreak.user.id, records.longestStreak.user.name, records.longestStreak.user.colorIndex).text}`}
            >
              {records.longestStreak.user.name}
            </Link>
            <div className="text-xs text-zinc-500 mt-1">Consecutivas</div>
          </div>
        </RecordCard>
      )}
    </div>
  );
}
