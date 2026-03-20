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
        <div className="divide-y divide-slate-800/50 -mx-1 flex-1 flex flex-col">
          {data.map((user, index) => {
            const userColor = getColorForUser(user.user_id, user.name, user.color_index);
            return (
              <div
                key={user.user_id}
                className="group flex flex-1 items-center justify-between py-2 px-2 hover:bg-white/5 transition-colors w-full"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-slate-500 font-mono text-[10px] w-4 flex-shrink-0">
                    #{index + 1}
                  </span>
                  <Link
                    href={`/user/${user.user_id}`}
                    className="relative w-10 h-10 shrink-0 transition-transform hover:scale-110 active:scale-95 z-10"
                  >
                    {user.icon ? (
                      <Image
                        src={user.icon}
                        alt={user.name}
                        fill
                        className="rounded-full object-cover ring-2 ring-white/10"
                        sizes="40px"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/10"
                        style={{ backgroundColor: userColor.stroke }}
                      >
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </Link>
                  <Link
                    href={`/user/${user.user_id}`}
                    className={`font-bold text-sm ${userColor.text} transition-transform group-hover:translate-x-1 origin-left truncate`}
                  >
                    {user.name}
                  </Link>
                </div>

                {/* Wins Column */}
                <div className="flex flex-col items-center px-3 mx-1 min-w-[50px]">
                  <span className="text-xl font-black text-white tabular-nums leading-none">
                    {user.wins}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Vic
                  </span>
                </div>

                {/* Margin Column */}
                <div className="text-right min-w-[80px] pr-1">
                  <span className="block text-xl font-black text-yellow-500 tracking-tighter leading-none tabular-nums">
                    +{user.avg_margin.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Margen
                  </span>
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
