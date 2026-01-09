'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Swords } from 'lucide-react';
import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';

export default function AllPlayAllCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=all-play-all');

  return (
    <Card
      title="Campeón Virtual (All-Play-All)"
      icon={Swords}
      color="yellow"
      loading={loading}
      tooltip="Clasificación si cada jornada jugaras un 1vs1 contra todos los demás managers."
      className="h-full flex flex-col"
    >
      {!loading && data.length > 0 ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="min-h-[40px] flex items-center mb-4 flex-shrink-0">
            <p className="text-sm text-slate-400 italic px-2 leading-tight">
              Si jugaras contra <span className="text-yellow-400 font-bold not-italic">todos</span>{' '}
              los rivales cada jornada. Efectividad{' '}
              <span className="text-yellow-400 font-bold not-italic">H2H</span> real.
            </p>
          </div>

          {/* List Container - Increased gap between items (space-y-2) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {data.map((user, index) => {
              const colors = getColorForUser(user.user_id, user.name, user.color_index);

              // Determine Rank Color
              let rankColor = 'text-slate-600';
              if (index === 0) rankColor = 'text-yellow-400';
              if (index === 1) rankColor = 'text-zinc-300';
              if (index === 2) rankColor = 'text-amber-600';

              return (
                <div key={user.user_id} className="relative group rounded-lg">
                  {/* Hover background */}
                  <div className="absolute inset-0 bg-slate-800/30 rounded-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Increased vertical padding (py-3) */}
                  <div className="flex items-center justify-between py-3 px-2">
                    {/* Left Section: Rank, Avatar & Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Increased font size */}
                      <span
                        className={`text-sm sm:text-base font-bold w-5 flex-shrink-0 text-center ${rankColor}`}
                      >
                        {index + 1}
                      </span>

                      {/* Increased Avatar size */}
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs text-white flex-shrink-0 transition-all"
                        style={{ backgroundColor: colors.stroke }}
                      >
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>

                      <Link
                        href={`/user/${user.user_id}`}
                        // Increased font size
                        className={`${colors.text} font-medium text-sm sm:text-base truncate transition-transform group-hover:scale-105 origin-left max-w-[100px] sm:max-w-none`}
                      >
                        {user.name}
                      </Link>
                    </div>

                    {/* Right Section: Stats */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                      {/* Record Group */}
                      <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/50 rounded px-3 py-1.5">
                        <div className="flex flex-col items-center">
                          {/* Increased font size for stats */}
                          <span className="text-sm sm:text-xl font-bold text-green-400 leading-none">
                            {user.wins}
                          </span>
                        </div>
                        <span className="text-slate-600 font-bold text-xs sm:text-sm">-</span>
                        <div className="flex flex-col items-center">
                          <span className="text-sm sm:text-xl font-bold text-slate-400 leading-none">
                            {user.ties}
                          </span>
                        </div>
                        <span className="text-slate-600 font-bold text-xs sm:text-sm">-</span>
                        <div className="flex flex-col items-center">
                          <span className="text-sm sm:text-xl font-bold text-red-400 leading-none">
                            {user.losses}
                          </span>
                        </div>
                      </div>

                      {/* Percentage Badge */}
                      <div className="bg-slate-800 rounded px-2 py-1 border border-slate-700 min-w-[44px] text-center">
                        {/* Increased font size */}
                        <span className="text-yellow-400 font-black text-sm sm:text-base">
                          {user.pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="flex h-full items-center justify-center text-slate-500 text-lg">
            Calculando liga virtual...
          </div>
        )
      )}
    </Card>
  );
}
