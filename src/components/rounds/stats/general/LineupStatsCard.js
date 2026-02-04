'use client';

import { Users, BarChart3, User } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import Image from 'next/image';

/**
 * LineupStatsCard - Displays preferred lineup formations
 * 1. Global usage chart
 * 2. Per-user favorite formation
 */
export default function LineupStatsCard({ globalStats = [], userStats = [] }) {
  if (!globalStats.length && !userStats.length) return null;

  // Format e.g., "1-2-2" -> "1-2-2"
  // Calculate max percentage for bar scaling
  const maxGlobalPct = Math.max(...globalStats.map((s) => s.percentage));

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        {/* LEFT: GLobal Stats */}
        <div>
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-6 pb-2 border-b border-white/5">
            <BarChart3 size={14} />
            Tendencia Global
          </h4>

          <div className="space-y-4">
            {globalStats.slice(0, 5).map((stat) => (
              <div key={stat.formation} className="group">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-white tracking-widest">{stat.formation}</span>
                  <span className="text-zinc-400 text-xs font-mono">
                    {stat.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500/80 rounded-full group-hover:bg-purple-400 transition-colors duration-500"
                    style={{ width: `${(stat.percentage / maxGlobalPct) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: User Favorites */}
        <div>
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-6 pb-2 border-b border-white/5">
            <User size={14} />
            Favorita por Usuario
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {userStats.map((user) => {
              const color = getColorForUser(user.userId, user.name, user.color_index);

              return (
                <div
                  key={user.userId}
                  className="bg-zinc-900/50 border border-white/5 rounded-lg p-3 hover:bg-white/5 transition-colors group flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full p-[2px]"
                      style={{
                        background: `linear-gradient(135deg, ${color.stroke}, transparent)`,
                      }}
                    >
                      {user.icon ? (
                        <Image
                          src={user.icon}
                          alt={user.name}
                          width={36}
                          height={36}
                          className="rounded-full w-full h-full object-cover bg-zinc-900"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">
                          {user.name[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold truncate max-w-[80px] ${color.text}`}>
                      {user.name}
                    </span>
                    <span className="text-lg font-black text-white leading-none tracking-tighter">
                      {user.favorite.formation}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-medium">
                      {user.favorite.percentage.toFixed(0)}% de uso
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
