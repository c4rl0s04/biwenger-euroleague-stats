'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Grid } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getColorForUser } from '@/lib/constants/colors';
import { useState } from 'react';

export default function RoundHeatmapCard() {
  const { data, loading } = useApiData('/api/standings/advanced?type=heatmap');
  const [hoveredCell, setHoveredCell] = useState(null);

  const getColor = (score) => {
    if (score === null) return 'bg-slate-800/60 text-slate-500'; // Did not participate

    if (score >= 230)
      return 'bg-fuchsia-600/40 text-fuchsia-100 shadow-[0_0_15px_rgba(192,38,211,0.4)] font-black border border-fuchsia-500/50'; // Top Tier

    if (score >= 210)
      return 'bg-purple-600/40 text-purple-100 shadow-[0_0_10px_rgba(147,51,234,0.3)] font-bold border border-purple-500/40'; // Excellent

    if (score >= 190)
      return 'bg-indigo-600/40 text-indigo-100 font-bold border border-indigo-500/40'; // Great

    if (score >= 170) return 'bg-blue-600/40 text-blue-100 border border-blue-500/40'; // Above Average

    if (score >= 150) return 'bg-emerald-600/40 text-emerald-100 border border-emerald-500/40'; // Average

    if (score >= 130) return 'bg-yellow-600/40 text-yellow-100 border border-yellow-500/40'; // Below Average

    if (score >= 110) return 'bg-orange-600/40 text-orange-100 border border-orange-500/40'; // Low

    return 'bg-red-600/40 text-red-100 border border-red-500/40'; // Lowest (< 110)
  };

  // Helper to keep tooltip inside the card
  const getTooltipPosition = (roundIndex, userIndex, totalRounds, totalUsers) => {
    const isTopHalf = roundIndex < 3; // First 3 rounds: tooltip goes below
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
      title="Mapa de Calor (Heatmap)"
      icon={Grid}
      color="indigo"
      loading={loading}
      className="h-full"
    >
      {!loading && data ? (
        <div className="w-full h-full flex flex-col">
          {/* Header Row (Users) */}
          <div className="flex w-full mb-1 py-1 flex-shrink-0">
            <div className="w-12 flex-shrink-0 font-bold text-[10px] text-slate-400 flex items-end justify-center pb-1">
              Jor.
            </div>
            {data.users.map((user) => {
              const userColor = getColorForUser(user.id, user.name);
              return (
                <Link
                  key={user.id}
                  href={`/user/${user.id}`}
                  className="flex-1 flex flex-col items-center gap-1 group min-w-0"
                >
                  {user.icon ? (
                    <Image
                      src={user.icon}
                      alt={user.name}
                      width={28}
                      height={28}
                      unoptimized
                      className="rounded-full object-cover ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white transition-all transition-transform group-hover:scale-110"
                      style={{ backgroundColor: userColor.stroke }}
                    >
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span
                    className={`text-[9px] font-bold truncate w-full text-center transition-colors px-0.5 ${userColor.text}`}
                  >
                    {user.name.slice(0, 3)}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Round Rows Container */}
          <div className="flex-1 flex flex-col gap-[1px] min-h-0 overflow-visible">
            {data.rounds.map((round, roundIndex) => (
              <div key={round.id} className="flex w-full items-center flex-1 min-h-[1.25rem]">
                {/* Round Name */}
                <div className="w-12 flex-shrink-0 font-mono text-[9px] text-slate-500 text-center mr-1">
                  {round.name.replace('Jornada ', 'J')}
                </div>

                {/* User Scores */}
                {data.users.map((user, userIndex) => {
                  const score = user.scores[roundIndex];
                  const cellId = `${round.id}-${user.id}`;
                  const isHovered = hoveredCell === cellId;

                  return (
                    <div key={cellId} className="flex-1 h-full px-[1px] relative">
                      <div
                        className={`
                          relative w-full h-full rounded-sm flex items-center justify-center text-[9px] font-medium transition-all duration-200
                          ${getColor(score)}
                          ${score !== null ? 'cursor-default' : 'opacity-50'}
                          
                          /* Hover State: Subtle lift, brightness boost, and shadow. No giant box expansion. */
                          ${
                            isHovered && score !== null
                              ? 'z-30 scale-110 shadow-[0_0_10px_rgba(0,0,0,0.5)] brightness-125 saturate-125'
                              : score !== null
                                ? 'hover:brightness-110'
                                : ''
                          }
                        `}
                        onMouseEnter={() => setHoveredCell(cellId)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {score ?? ''}
                      </div>

                      {/* Floating Tooltip */}
                      {isHovered && score !== null && (
                        <div
                          className={`
                            absolute z-50 bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-xl rounded-lg px-3 py-2 text-center min-w-[100px] pointer-events-none
                            ${getTooltipPosition(roundIndex, userIndex, data.rounds.length, data.users.length)}
                          `}
                        >
                          {/* User Name */}
                          <div className="text-[10px] font-bold text-slate-300 mb-0.5 whitespace-nowrap">
                            {user.name}
                          </div>

                          {/* Score Highlight */}
                          <div
                            className={`text-lg font-black leading-none my-1 ${getColor(score).split(' ')[1]}`}
                          >
                            {score}{' '}
                            <span className="text-[9px] font-normal text-slate-500">pts</span>
                          </div>

                          {/* Round Name */}
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
      ) : (
        !loading && <div className="text-center text-slate-500 py-8">Cargando datos...</div>
      )}
    </Card>
  );
}
