'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getColorForUser } from '@/lib/constants/colors';

// --- Helper function for dynamic cell styling ---
const getPositionCellClasses = (change, position) => {
  const base =
    'w-7 h-7 rounded flex items-center justify-center text-xs border tabular-nums transition-all hover:scale-110 hover:z-10 cursor-default font-bold shadow-sm';

  // --- PODIUM STYLES (Overrides Trends) ---

  // 1. GOLD (Rank 1)
  if (position === 1) {
    return `${base} bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 text-yellow-300 border-yellow-500/60 shadow-[0_0_10px_rgba(234,179,8,0.3)] ring-1 ring-yellow-400/20 font-extrabold text-[13px]`;
  }

  // 2. SILVER (Rank 2)
  if (position === 2) {
    return `${base} bg-gradient-to-br from-slate-300/20 to-slate-400/10 text-slate-200 border-slate-400/60 shadow-[0_0_10px_rgba(148,163,184,0.2)] ring-1 ring-slate-300/20 font-extrabold`;
  }

  // 3. BRONZE (Rank 3)
  if (position === 3) {
    return `${base} bg-gradient-to-br from-orange-400/20 to-amber-600/10 text-amber-400 border-orange-500/60 shadow-[0_0_10px_rgba(249,115,22,0.2)] ring-1 ring-orange-400/20 font-extrabold`;
  }

  // --- TREND STYLES (Ranks 4+) ---

  // No change
  if (change === 0 || change === null) {
    return `${base} bg-slate-800/80 text-slate-500 border-slate-700/50 font-normal`;
  }

  const magnitude = Math.abs(change);
  const isUp = change > 0;

  if (isUp) {
    // Green Tiers
    if (magnitude >= 5) {
      // Massive Rise
      return `${base} bg-emerald-500 text-emerald-950 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] font-extrabold`;
    }
    if (magnitude >= 3) {
      // Good Rise
      return `${base} bg-emerald-600 text-white border-emerald-500 font-bold`;
    }
    // Standard Rise
    return `${base} bg-emerald-500/20 text-emerald-400 border-emerald-500/30`;
  } else {
    // Red Tiers
    if (magnitude >= 5) {
      // Massive Fall
      return `${base} bg-red-600 text-red-50 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)] font-extrabold`;
    }
    if (magnitude >= 3) {
      // Bad Fall
      return `${base} bg-red-700 text-white border-red-500 font-bold`;
    }
    // Standard Fall
    return `${base} bg-red-500/20 text-red-400 border-red-500/30`;
  }
};

export default function PositionEvolutionCard() {
  const { data, loading } = useApiData('/api/standings/advanced?type=position-evolution');

  return (
    <Card
      title="Evolución de Posiciones"
      icon={TrendingUp}
      color="cyan"
      loading={loading}
      tooltip="Evolución de ranking jornada a jornada. Top 3 y grandes cambios destacados."
      className="h-full flex flex-col"
    >
      {!loading && data && data.users ? (
        <div className="flex flex-col h-full gap-4">
          {/* Legend */}
          <div className="text-center space-y-1 px-2">
            <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm border border-yellow-500/60 bg-yellow-500/20 shadow-[0_0_4px_rgba(234,179,8,0.4)]" />
                Podio
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-emerald-500" />
                Subida fuerte
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-red-600" />
                Caída fuerte
              </span>
            </div>
          </div>

          {/* Highlights Section */}
          {data.valid && (
            <div className="flex items-center gap-4 text-xs px-1">
              {/* Biggest Climber */}
              <div className="flex-1 bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Name Container: flex-1 min-w-0 ensures it takes space but allows wrapping */}
                <div className="flex items-center gap-2.5 relative z-10 flex-1 min-w-0">
                  <div className="flex-shrink-0 p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                    <TrendingUp size={16} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-emerald-500/60 font-bold block text-[9px] uppercase tracking-wider">
                      Mayor Subida
                    </span>
                    {/* Removed truncate and max-w, added leading-tight for multi-line support */}
                    <span className="block font-bold text-slate-200 text-sm leading-tight break-words pr-1">
                      {data.stats?.biggestClimber?.name || '-'}
                    </span>
                  </div>
                </div>

                {/* Number Badge */}
                <div className="text-right flex items-center gap-1.5 relative z-10 flex-shrink-0">
                  <span className="px-2 py-1 rounded-md font-extrabold text-sm bg-emerald-500 text-emerald-950 min-w-[3ch] text-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    {data.stats?.biggestClimber?.change > 0
                      ? `+${data.stats.biggestClimber.change}`
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Biggest Faller */}
              <div className="flex-1 bg-red-950/30 border border-red-900/50 rounded-xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Name Container */}
                <div className="flex items-center gap-2.5 relative z-10 flex-1 min-w-0">
                  <div className="flex-shrink-0 p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
                    <TrendingDown size={16} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-red-500/60 font-bold block text-[9px] uppercase tracking-wider">
                      Mayor Caída
                    </span>
                    {/* Removed truncate and max-w */}
                    <span className="block font-bold text-slate-200 text-sm leading-tight break-words pr-1">
                      {data.stats?.biggestFaller?.name || '-'}
                    </span>
                  </div>
                </div>

                {/* Number Badge */}
                <div className="text-right flex items-center gap-1.5 relative z-10 flex-shrink-0">
                  <span className="px-2 py-1 rounded-md font-extrabold text-sm bg-red-600 text-red-50 min-w-[3ch] text-center shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                    {data.stats?.biggestFaller?.change || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* The Grid */}
          <div className="w-full flex-1 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 rounded-lg">
            <div className="w-full min-w-max px-1">
              {/* Header Row */}
              <div className="flex items-center mb-2 border-b border-slate-800/50 pb-1">
                {/* Maintained w-48 from previous fix to ensure list view also fits long names */}
                <div className="w-48 flex-shrink-0 text-[10px] uppercase tracking-wider font-bold text-slate-500 px-2 sticky left-0 z-10">
                  JUGADOR
                </div>
                {data.rounds.map((round) => (
                  <div
                    key={round.id}
                    className="flex-1 min-w-[2.75rem] text-center text-[10px] font-mono font-bold text-slate-500"
                  >
                    {round.name.replace('Jornada ', 'J')}
                  </div>
                ))}
              </div>

              {/* User Rows */}
              <div className="space-y-1.5">
                {data.users.map((user) => {
                  const userColor = getColorForUser(user.id, user.name, user.color_index);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center hover:bg-slate-800/50 rounded-md transition-colors group py-0.5"
                    >
                      <Link
                        href={`/user/${user.id}`}
                        className={`w-48 flex-shrink-0 flex items-center gap-2.5 px-2 sticky left-0 z-10 py-1 rounded-l-md bg-slate-900/0 group-hover:bg-slate-900/0 transition-all`}
                      >
                        {user.icon ? (
                          <div className="relative w-5 h-5 shrink-0">
                            <Image
                              src={user.icon}
                              alt={user.name}
                              fill
                              className="rounded-full object-cover border border-slate-700 ring-1 ring-black/20"
                              sizes="20px"
                            />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400 border border-slate-700">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <span
                          className={`text-[11px] font-semibold ${userColor.text} opacity-80 group-hover:opacity-100 group-hover:text-white transition-all whitespace-nowrap`}
                        >
                          {user.name}
                        </span>
                      </Link>

                      {user.history.map((historyItem, idx) => {
                        const { position, change } = historyItem;

                        // Pass position to helper to trigger Podium Colors
                        const cellClasses = getPositionCellClasses(change, position);

                        return (
                          <div
                            key={idx}
                            className="flex-1 min-w-[2.75rem] flex items-center justify-center"
                          >
                            <div
                              className={cellClasses}
                              title={`J${data.rounds[idx].name}: Pos ${position}`}
                            >
                              {position}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-12">Cargando datos...</div>
      )}
    </Card>
  );
}
