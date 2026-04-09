'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getShortRoundName } from '@/lib/utils/format';

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
                href={`/user/${user.id}`}
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
                {getShortRoundName(round.name)}
              </div>

              {/* User Scores */}
              {users.map((user, userIndex) => {
                const cell = round.scores[user.name];
                // Handle both old (number | null) and new ({ score, is_partial }) shapes
                const score = cell !== null && typeof cell === 'object' ? cell.score : cell;
                const isPartial =
                  cell !== null && typeof cell === 'object' ? cell.is_partial : false;
                const cellId = `${round.id}-${user.name}`;
                const isHovered = hoveredCell === cellId;

                return (
                  <div key={cellId} className="flex-1 h-full px-[1px] relative flex items-center">
                    <div
                      className={cn(
                        'relative w-full h-[1.75rem] rounded-sm flex items-center justify-center text-[10px] font-medium transition-all duration-200 overflow-hidden',
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
                      {/* Partial round diagonal stripe overlay */}
                      {isPartial && score !== null && (
                        <div
                          className="absolute inset-0 pointer-events-none opacity-40"
                          style={{
                            backgroundImage:
                              'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.4) 3px, rgba(0,0,0,0.4) 4px)',
                          }}
                        />
                      )}
                      <span className="relative z-10">{score ?? ''}</span>
                      {/* Partial asterisk badge */}
                      {isPartial && score !== null && (
                        <span className="absolute top-0 right-0.5 text-[7px] font-black text-white/80 leading-none z-20">
                          *
                        </span>
                      )}
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
                        {isPartial && (
                          <div className="text-[8px] font-bold text-amber-400/80 uppercase tracking-wider mt-1">
                            ⚠ Participación parcial
                          </div>
                        )}
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

        {/* Legend */}
        <div className="flex-shrink-0 pt-3 border-t border-white/5 flex items-center gap-2 mt-2">
          <div className="w-3 h-3 rounded-sm bg-slate-700 border border-slate-600 relative overflow-hidden flex-shrink-0">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.5) 1px, rgba(0,0,0,0.5) 2px)',
              }}
            />
            <span className="absolute top-0 right-0 text-[5px] text-white font-black">*</span>
          </div>
          <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">
            Participación parcial (no computa para el promedio)
          </span>
        </div>
      </div>
    </Card>
  );
}
