'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * Get color class based on efficiency value (0-100)
 */
function getEfficiencyColor(efficiency) {
  if (efficiency === null || efficiency === undefined) return 'bg-zinc-800/60 text-zinc-500'; // Did not participate

  if (efficiency >= 95)
    return 'bg-emerald-900/90 text-white shadow-[0_0_12px_rgba(6,78,59,0.5)] font-bold border border-emerald-700/50';
  if (efficiency >= 90)
    return 'bg-teal-700/85 text-white shadow-[0_0_8px_rgba(15,118,110,0.3)] font-bold border border-teal-600/50';
  if (efficiency >= 85)
    return 'bg-green-600/80 text-white font-semibold border border-green-500/50';
  if (efficiency >= 80) return 'bg-lime-600/80 text-white border border-lime-500/50';
  if (efficiency >= 75) return 'bg-yellow-500/80 text-white border border-yellow-400/50';
  if (efficiency >= 70) return 'bg-orange-500/80 text-white border border-orange-400/50';
  return 'bg-red-500/80 text-white border border-red-400/50';
}

/**
 * EfficiencyHeatmap - A heatmap showing efficiency across users and rounds
 * Rows = Rounds, Columns = Users
 */
export default function EfficiencyHeatmap({ allUsersHistory = [], users = [], loading = false }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Transform data: organize by round, then by user
  const { rounds, userData } = useMemo(() => {
    if (!allUsersHistory.length) return { rounds: [], userData: {} };

    // Collect all unique rounds from all users' history
    const roundsSet = new Map();
    const userData = {};

    allUsersHistory.forEach(({ userId, history }) => {
      userData[userId] = {};
      history.forEach((round) => {
        roundsSet.set(round.round_number, round.round_id);
        userData[userId][round.round_number] = {
          efficiency: round.efficiency,
          actual: round.actual_points,
          ideal: round.ideal_points,
        };
      });
    });

    // Sort rounds by number
    const rounds = Array.from(roundsSet.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([number, id]) => ({ number, id }));

    return { rounds, userData };
  }, [allUsersHistory]);

  // Tooltip position helper
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

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-6 bg-white/5 rounded" />
        ))}
      </div>
    );
  }

  if (!rounds.length || !users.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No hay datos de eficiencia disponibles
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Header Row (Users) */}
      <div className="flex w-full mb-1 py-1 flex-shrink-0">
        <div className="w-10 flex-shrink-0 font-bold text-[10px] text-muted-foreground flex items-end justify-center pb-1">
          Jor.
        </div>
        {users.map((user) => {
          const userColor = getColorForUser(user.id, user.name, user.color_index);
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
                  width={24}
                  height={24}
                  unoptimized
                  className="rounded-full object-cover ring-2 ring-transparent group-hover:ring-emerald-500/50 transition-all group-hover:scale-110"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white transition-all group-hover:scale-110"
                  style={{ backgroundColor: userColor.stroke }}
                >
                  {user.name.charAt(0)}
                </div>
              )}
              <span
                className={`text-[9px] font-bold truncate w-full text-center transition-colors px-0.5 ${userColor.text}`}
              >
                {user.name.slice(0, 4)}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Round Rows */}
      <div className="flex-1 flex flex-col gap-[1px] min-h-0 overflow-visible">
        {rounds.map((round, roundIndex) => (
          <div key={round.id} className="flex w-full items-center min-h-[1.5rem]">
            {/* Round Label */}
            <div className="w-10 flex-shrink-0 font-mono text-[9px] text-muted-foreground text-center">
              J{round.number}
            </div>

            {/* User Efficiency Cells */}
            {users.map((user, userIndex) => {
              const data = userData[user.id]?.[round.number];
              const efficiency = data?.efficiency ?? null;
              const cellId = `${round.id}-${user.id}`;
              const isHovered = hoveredCell === cellId;

              return (
                <div key={cellId} className="flex-1 h-full px-[1px] relative">
                  <div
                    className={`
                      relative w-full h-full rounded-sm flex items-center justify-center text-[9px] font-medium transition-all duration-200
                      ${getEfficiencyColor(efficiency)}
                      ${efficiency !== null ? 'cursor-default' : 'opacity-50'}
                      ${
                        isHovered && efficiency !== null
                          ? 'z-30 scale-110 shadow-[0_0_10px_rgba(0,0,0,0.5)] brightness-125'
                          : efficiency !== null
                            ? 'hover:brightness-110'
                            : ''
                      }
                    `}
                    onMouseEnter={() => setHoveredCell(cellId)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {efficiency !== null ? `${Math.round(efficiency)}` : ''}
                  </div>

                  {/* Tooltip */}
                  {isHovered && efficiency !== null && (
                    <div
                      className={`
                        absolute z-50 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-xl rounded-lg px-3 py-2 text-center min-w-[110px] pointer-events-none
                        ${getTooltipPosition(roundIndex, userIndex, rounds.length, users.length)}
                      `}
                    >
                      <div className="text-[10px] font-bold text-zinc-300 mb-0.5 whitespace-nowrap">
                        {user.name}
                      </div>
                      <div className="text-lg font-black leading-none my-1 text-emerald-400">
                        {efficiency.toFixed(1)}
                        <span className="text-[9px] font-normal text-zinc-500">%</span>
                      </div>
                      <div className="text-[9px] text-zinc-400 flex justify-between gap-2">
                        <span>Real: {data?.actual?.toFixed(0)}</span>
                        <span>Ideal: {data?.ideal?.toFixed(0)}</span>
                      </div>
                      <div className="text-[9px] text-zinc-500 border-t border-zinc-700/50 pt-1 mt-1">
                        Jornada {round.number}
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
      <div className="flex items-center justify-center gap-3 mt-4 text-[9px] text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-900/90 border border-emerald-700/50" />
          <span>95%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-600/80 border border-green-500/50" />
          <span>85-94%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500/80 border border-yellow-400/50" />
          <span>75-84%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/80 border border-red-400/50" />
          <span>&lt;70%</span>
        </div>
      </div>
    </div>
  );
}
