'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Crown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getColorForUser } from '@/lib/constants/colors';

export default function DominanceCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=dominance');

  return (
    <Card
      title="Margen de Victoria (Dominance)"
      icon={Crown}
      color="yellow"
      loading={loading}
      tooltip="Promedio de puntos de diferencia sobre el 2º clasificado en las jornadas ganadas."
    >
      {!loading && data.length > 0 ? (
        <div className="flex flex-col gap-2 h-full">
          {data.map((user, index) => {
            const userColor = getColorForUser(user.user_id, user.name, user.color_index);
            return (
              <div
                key={user.user_id}
                className="group flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 transition-colors w-full"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-slate-500 font-mono text-xs w-4">#{index + 1}</span>
                  {user.icon ? (
                    <div className="relative w-10 h-10 shrink-0">
                      <Image
                        src={user.icon}
                        alt={user.name}
                        fill
                        className="rounded-full object-cover ring-2 ring-white/10"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/10"
                      style={{ backgroundColor: userColor.stroke }}
                    >
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <Link
                    href={`/user/${user.user_id}`}
                    className={`font-semibold text-sm ${userColor.text} transition-transform group-hover:scale-105 origin-left truncate`}
                  >
                    {user.name}
                  </Link>
                </div>

                {/* Wins Column */}
                <div className="flex flex-col items-center px-4 mx-2 min-w-[60px]">
                  <span className="text-xl font-bold text-white">{user.wins}</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider">Vic</span>
                </div>

                {/* Margin Column */}
                <div className="text-right min-w-[70px]">
                  <span className="block text-xl font-black text-yellow-400 tracking-tight">
                    +{user.avg_margin.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wide">Margen</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">Sin victorias registradas</div>
      )}
    </Card>
  );
}
