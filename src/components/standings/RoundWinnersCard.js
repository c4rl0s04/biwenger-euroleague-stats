'use client';

import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { useMemo } from 'react';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function RoundWinnersCard() {
  const { data: winners = [], loading } = useApiData('/api/standings/round-winners');

  return (
    <Card title="Ganadores de Jornada" icon={Trophy} color="yellow" loading={loading}>
      {!loading && (
        <div className="flex flex-wrap justify-center gap-3">
          {winners.length > 0 ? (
            winners.map((winner) => {
              const colors = getColorForUser(winner.user_id, winner.name);
              return (
                <div
                  key={`${winner.round_id}-${winner.user_id}`}
                  className={`flex-shrink-0 w-28 p-3 rounded-xl text-center transition-all bg-gradient-to-b ${colors.bg} border ${colors.border} ${colors.text} hover:scale-105`}
                >
                  <div className="text-slate-400 text-[10px] font-medium mb-2">
                    {winner.round_name}
                  </div>
                  <div className="flex justify-center mb-2">
                    {winner.icon ? (
                      <img
                        src={winner.icon}
                        alt={winner.name}
                        className="w-10 h-10 rounded-full ring-2 ring-white/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-white">
                        {winner.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/user/${winner.user_id}`}
                    className="text-xs font-bold truncate mb-1 text-white hover:text-inherit block"
                  >
                    {winner.name}
                  </Link>
                  <div className="text-sm font-bold">{winner.points} pts</div>
                </div>
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
