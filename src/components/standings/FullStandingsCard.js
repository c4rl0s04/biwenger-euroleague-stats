'use client';

import { Trophy, Medal } from 'lucide-react';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';

export default function FullStandingsCard() {
  const [sortConfig, setSortConfig] = useState({ key: 'position', direction: 'asc' });
  const { data: standings = [], loading } = useApiData('/api/standings/full');

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStandings = [...standings].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (sortConfig.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getPriceTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-slate-500" />;
  };

  const getPositionStyle = (position) => {
    if (position === 1) return 'bg-yellow-500 text-slate-900';
    if (position === 2) return 'bg-slate-300 text-slate-900';
    if (position === 3) return 'bg-orange-600 text-white';
    return 'bg-slate-700 text-slate-300';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES').format(price);
  };

  const leader = standings[0];

  return (
    <Card
      title="Clasificación Completa"
      icon={Trophy}
      color="indigo"
      className="lg:col-span-2"
      loading={loading}
    >
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-3 py-3 rounded-l-lg">Pos</th>
                <th className="px-3 py-3">Usuario</th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('total_points')}
                >
                  Puntos {getSortIndicator('total_points')}
                </th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors hidden md:table-cell"
                  onClick={() => handleSort('avg_points')}
                >
                  Media {getSortIndicator('avg_points')}
                </th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                  onClick={() => handleSort('round_wins')}
                >
                  Victorias {getSortIndicator('round_wins')}
                </th>
                <th
                  className="px-3 py-3 text-right cursor-pointer hover:text-white transition-colors rounded-r-lg"
                  onClick={() => handleSort('team_value')}
                >
                  Valor {getSortIndicator('team_value')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((user) => {
                const gapToLeader = leader ? leader.total_points - user.total_points : 0;
                const userColor = getColorForUser(user.user_id, user.name);
                return (
                  <tr
                    key={user.user_id}
                    className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getPositionStyle(user.position)}`}
                      >
                        {user.position}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/user/${user.user_id}`}
                        className="flex items-center gap-2 group hover:opacity-100"
                      >
                        {user.icon ? (
                          <img
                            src={user.icon}
                            alt={user.name}
                            className="w-8 h-8 rounded-full transition-opacity group-hover:opacity-80"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium transition-opacity group-hover:opacity-80">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div
                            className={`font-medium transition-transform group-hover:scale-105 origin-left inline-block ${userColor.text}`}
                          >
                            {user.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user.rounds_played} jornadas
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="font-bold text-orange-500">{user.total_points}</div>
                      {gapToLeader > 0 && (
                        <div className="text-xs text-red-400">-{gapToLeader}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right hidden md:table-cell">
                      <div className="text-slate-300">{user.avg_points}</div>
                      <div className="text-xs text-slate-500">
                        {user.best_round} / {user.worst_round}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right hidden lg:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        {user.round_wins > 0 && <Medal className="w-4 h-4 text-yellow-500" />}
                        <span
                          className={
                            user.round_wins > 0 ? 'text-yellow-400 font-bold' : 'text-slate-500'
                          }
                        >
                          {user.round_wins}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400 text-xs">
                          {formatPrice(user.team_value)}€
                        </span>
                        {getPriceTrendIcon(user.price_trend)}
                      </div>
                      {user.price_trend !== 0 && (
                        <div
                          className={`text-[10px] ${user.price_trend > 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {user.price_trend > 0 ? '+' : ''}
                          {formatPrice(user.price_trend)}€
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
