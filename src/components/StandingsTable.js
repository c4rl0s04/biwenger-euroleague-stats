'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StandingsTable({ standings }) {
  const [sortConfig, setSortConfig] = useState({ key: 'position', direction: 'asc' });

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

  const getPointsGap = (currentPoints, position) => {
    if (position === 1) return null;
    const prevUser = sortedStandings.find(u => u.position === position - 1);
    if (!prevUser) return null;
    return prevUser.total_points - currentPoints;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES').format(price);
  };

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
        <tr>
          <th className="px-2 py-2 rounded-l-lg">Pos</th>
          <th className="px-2 py-2">Usuario</th>
          <th 
            className="px-2 py-2 text-right cursor-pointer hover:text-white transition-colors"
            onClick={() => handleSort('total_points')}
          >
            Puntos {getSortIndicator('total_points')}
          </th>
          <th 
            className="px-2 py-2 text-right cursor-pointer hover:text-white transition-colors"
            onClick={() => handleSort('team_value')}
          >
            Valor {getSortIndicator('team_value')}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedStandings.map((user, idx) => {
          const pointsGap = getPointsGap(user.total_points, user.position);
          return (
            <tr key={user.user_id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
              <td className="px-2 py-2 font-medium text-white text-xs">#{user.position}</td>
              <td className="px-2 py-2">
                <div className="flex items-center gap-2">
                  {user.icon ? (
                    <img src={user.icon} alt={user.name} className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">{user.name.charAt(0)}</div>
                  )}
                  <span className="truncate max-w-[100px] sm:max-w-none text-xs">{user.name}</span>
                </div>
              </td>
              <td className="px-2 py-2 text-right">
                <div className="font-bold text-orange-500 text-sm">{user.total_points}</div>
                {pointsGap !== null && (
                  <div className="text-xs text-red-400 font-medium">-{pointsGap}</div>
                )}
              </td>
              <td className="px-2 py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-slate-400 text-xs">{formatPrice(user.team_value)}€</span>
                  {getPriceTrendIcon(user.price_trend)}
                </div>
                {user.price_trend !== 0 && (
                  <div className={`text-[10px] ${user.price_trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {user.price_trend > 0 ? '+' : ''}{formatPrice(Math.abs(user.price_trend))}€
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
