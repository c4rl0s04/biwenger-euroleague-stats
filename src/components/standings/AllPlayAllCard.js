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
      tooltip="Clasificación si cada jornada jugaras un 1vs1 contra todos los demás managers. % de victorias totales."
    >
      {!loading && data.length > 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-400 italic px-2">
            Simulamos que cada jornada juegas contra{' '}
            <span className="text-yellow-400 font-bold not-italic">todos</span> los rivales a la
            vez. Mide tu efectividad real en{' '}
            <span className="text-slate-200 font-bold not-italic">enfrentamientos directos</span>{' '}
            (H2H).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2 rounded-l-lg">Manager</th>
                  <th className="px-3 py-2 text-center">W-L-T</th>
                  <th className="px-3 py-2 text-right rounded-r-lg">% Vic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.map((user) => {
                  const userColor = getColorForUser(user.user_id, user.name);
                  return (
                    <tr key={user.user_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-3 py-2 font-medium">
                        <Link
                          href={`/user/${user.user_id}`}
                          className={`${userColor.hover} transition-colors`}
                        >
                          {user.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-center text-slate-400 text-xs">
                        {user.wins}-{user.losses}-{user.ties}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-yellow-500">
                        {user.pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center text-slate-500 py-4">Calculando liga virtual...</div>
        )
      )}
    </Card>
  );
}
