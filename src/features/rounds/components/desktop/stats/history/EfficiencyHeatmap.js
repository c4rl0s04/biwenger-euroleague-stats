'use client';

import { Skeleton } from '@/components/ui/foundation';

import { useMemo } from 'react';
import Image from 'next/image';
import { Popover } from '@/components/ui/foundation';
import Link from 'next/link';
import { getColorForUser } from '@/lib/competition/public';

/**
 * Get color class based on efficiency value (0-100)
 */
function getEfficiencyColor(efficiency) {
  if (efficiency === null || efficiency === undefined)
    return 'bg-secondary/60 text-muted-foreground'; // Did not participate

  if (efficiency >= 95)
    return 'bg-emerald-900/90 text-white font-bold border border-emerald-700/50';
  if (efficiency >= 90) return 'bg-teal-700/85 text-white font-bold border border-teal-600/50';
  if (efficiency >= 85) return 'bg-green-800 text-white font-semibold border border-green-500/50';
  if (efficiency >= 80) return 'bg-lime-600/80 text-black border border-lime-500/50';
  if (efficiency >= 75) return 'bg-yellow-500/80 text-black border border-yellow-400/50';
  if (efficiency >= 70) return 'bg-orange-500/80 text-black border border-orange-400/50';
  return 'bg-red-700 text-white border border-red-400/50';
}

/**
 * EfficiencyHeatmap - A heatmap showing efficiency across users and rounds
 * Rows = Rounds, Columns = Users
 */
export default function EfficiencyHeatmap({ allUsersHistory = [], users = [], loading = false }) {
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

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-6 bg-secondary rounded" />
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
    <div className="w-full flex flex-col h-full">
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
                className={`text-[9px] font-bold truncate w-full text-center transition-colors px-0.5 text-foreground`}
              >
                {user.name.slice(0, 4)}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Round Rows */}
      <div className="flex-1 flex flex-col gap-[1px] min-h-0 overflow-visible">
        {rounds.map((round) => (
          <div key={round.id} className="flex w-full items-center flex-1 min-h-[1.5rem]">
            {/* Round Label */}
            <div className="w-10 flex-shrink-0 font-mono text-[9px] text-muted-foreground text-center">
              J{round.number}
            </div>

            {/* User Efficiency Cells */}
            {users.map((user) => {
              const data = userData[user.id]?.[round.number];
              const efficiency = data?.efficiency ?? null;
              const cellId = `${round.id}-${user.id}`;

              return (
                <div key={cellId} className="flex-1 px-px">
                  {efficiency == null ? (
                    <span
                      aria-label={`${user.name}, jornada ${round.number}: sin datos`}
                      className="block min-h-7 rounded bg-secondary"
                    />
                  ) : (
                    <Popover
                      label={`${user.name}, jornada ${round.number}: ${efficiency.toFixed(1)}%`}
                      className={`flex min-h-7 w-full items-center justify-center rounded-sm text-xs ${getEfficiencyColor(efficiency)}`}
                      trigger={Math.round(efficiency)}
                    >
                      <p className="font-semibold">
                        {user.name} · J{round.number}
                      </p>
                      <p className="text-lg font-bold tabular-nums">{efficiency.toFixed(1)}%</p>
                      <p>
                        Real: {data?.actual?.toFixed(0)} · Ideal: {data?.ideal?.toFixed(0)}
                      </p>
                    </Popover>
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
