'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function HistoryTable({ history }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!history) return null;
  const { users, jornadas } = history;

  const getColor = (score) => {
    if (score === null || score === undefined) return 'bg-slate-800/60 text-slate-500';

    // Prediction scores (0-10)
    if (score >= 9)
      return 'bg-emerald-900/90 text-white shadow-[0_0_15px_rgba(6,78,59,0.6)] font-black border border-emerald-700/50';
    if (score >= 7)
      return 'bg-teal-700/85 text-white shadow-[0_0_10px_rgba(15,118,110,0.4)] font-bold border border-teal-600/50';
    if (score >= 5) return 'bg-green-600/80 text-white font-bold border border-green-500/50';
    if (score >= 4) return 'bg-yellow-500/80 text-white border border-yellow-400/50';
    if (score >= 3) return 'bg-orange-500/80 text-white border border-orange-400/50';
    return 'bg-red-500/80 text-white border border-red-400/50';
  };

  const getTooltipPosition = (roundIndex, userIndex, totalRounds, totalUsers) => {
    const isTopHalf = roundIndex < 3;
    const isLeftEdge = userIndex === 0;
    const isRightEdge = userIndex === totalUsers - 1;

    let vertical = isTopHalf ? 'top-full mt-2' : 'bottom-full mb-2';
    // Since rows are jornadas here (vertical list), identifying "top half" depends on round index in list (which is reversed usually? rounds are likely ordered).
    // Actually, jornadas.map passes index. Let's rely on that.

    let horizontal = 'left-1/2 -translate-x-1/2';
    if (isLeftEdge) horizontal = 'left-0';
    if (isRightEdge) horizontal = 'right-0';

    return `${vertical} ${horizontal}`;
  };

  return (
    <Card
      title="Histórico por Jornadas (Heatmap)"
      icon={CalendarDays}
      color="violet"
      className="h-full"
    >
      <div className="w-full h-full flex flex-col">
        {/* Header Row (Users) */}
        <div className="flex w-full mb-1 py-1 flex-shrink-0">
          <div className="w-16 flex-shrink-0 font-bold text-[10px] text-slate-400 flex items-end justify-center pb-1">
            Jor.
          </div>
          {users.map((user) => {
            const colorInfo = getColorForUser(user.id, user.name, user.color_index);
            return (
              <Link
                key={user.name}
                href={`/user/${user.id}`} // user object has id now
                className="flex-1 flex flex-col items-end justify-end pb-2 gap-1 group min-w-0"
              >
                <span
                  className={`text-sm font-bold truncate w-full text-center transition-colors px-0.5 ${colorInfo.text}`}
                >
                  {user.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Rows (Jornadas) */}
        <div className="flex-1 flex flex-col gap-[1px] min-h-0 overflow-visible">
          {jornadas.map((round, roundIndex) => (
            <div
              key={round.id}
              className="flex w-full items-center flex-1 min-h-[2rem] hover:bg-white/5 transition-colors rounded-sm"
            >
              {/* Round Name */}
              <div className="w-16 flex-shrink-0 font-mono text-[10px] text-slate-500 text-center mr-1">
                {round.name.replace('Jornada ', 'J')}
              </div>

              {/* User Scores */}
              {users.map((user, userIndex) => {
                const score = round.scores[user.name];
                const cellId = `${round.id}-${user.name}`;
                const isHovered = hoveredCell === cellId;

                return (
                  <div key={cellId} className="flex-1 h-full px-[1px] relative flex items-center">
                    <div
                      className={cn(
                        'relative w-full h-[1.75rem] rounded-sm flex items-center justify-center text-[10px] font-medium transition-all duration-200',
                        getColor(score),
                        score !== null ? 'cursor-default' : 'opacity-50',
                        isHovered && score !== null
                          ? 'z-30 scale-125 shadow-[0_0_10px_rgba(0,0,0,0.5)] brightness-125 saturate-125'
                          : score !== null
                            ? 'hover:brightness-110'
                            : ''
                      )}
                      onMouseEnter={() => setHoveredCell(cellId)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {score ?? ''}
                    </div>

                    {/* Tooltip */}
                    {isHovered && score !== null && (
                      <div
                        className={cn(
                          'absolute z-50 bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-xl rounded-lg px-3 py-2 text-center min-w-[100px] pointer-events-none',
                          getTooltipPosition(roundIndex, userIndex, jornadas.length, users.length)
                        )}
                      >
                        <div className="text-[10px] font-bold text-slate-300 mb-0.5 whitespace-nowrap">
                          {user.name}
                        </div>
                        <div
                          className={cn(
                            'text-lg font-black leading-none my-1',
                            getColor(score).split(' ')[1]
                          )}
                        >
                          {score} <span className="text-[9px] font-normal text-slate-500">pts</span>
                        </div>
                        <div className="text-[9px] text-slate-500 border-t border-slate-700/50 pt-1 mt-1">
                          {round.name}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
