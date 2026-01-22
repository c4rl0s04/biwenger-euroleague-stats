'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trophy } from 'lucide-react';
import { useMemo } from 'react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function RoundWinnersCard() {
  const { data: winners = [], loading } = useApiData('/api/standings/round-winners?limit=100');

  return (
    <Card title="Ganadores de Jornada" icon={Trophy} color="yellow" loading={loading}>
      {!loading && (
        <div className="flex flex-wrap justify-center gap-2">
          {winners.length > 0 ? (
            winners.map((winner) => {
              const colors = getColorForUser(winner.user_id, winner.name, winner.color_index);
              return (
                <Link
                  key={`${winner.round_id}-${winner.user_id}`}
                  href={`/user/${winner.user_id}`}
                  className={`group flex-shrink-0 w-20 p-2 rounded-lg text-center transition-all bg-gradient-to-b ${colors.bg} border ${colors.border} ${colors.text} hover:scale-105 block`}
                >
                  <div className="text-slate-400 text-[9px] font-medium mb-1">
                    {winner.round_name.replace('Jornada ', 'J')}
                  </div>
                  <div className="flex justify-center mb-1">
                    {winner.icon ? (
                    <div className="relative w-8 h-8 shrink-0">
                      <Image
                        src={winner.icon}
                        alt={winner.name}
                        fill
                        className="rounded-full ring-2 ring-white/20 transition-transform group-hover:scale-105 object-cover"
                        sizes="32px"
                      />
                    </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white transition-transform group-hover:scale-105">
                        {winner.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-bold truncate mb-0.5 text-white group-hover:text-inherit transition-colors">
                    {winner.name}
                  </div>
                  <div className="text-xs font-bold">{winner.points}</div>
                </Link>
              );
            })
          ) : (
            <div className="text-center text-slate-500 py-4 w-full">No hay datos de ganadores</div>
          )}
        </div>
      )}
    </Card>
  );
}
