'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { UserAvatar } from '@/components/ui';

function StandingsTable({ standings }) {
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
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const getPointsGap = (currentPoints, position) => {
    if (position === 1) return null;
    const prevUser = sortedStandings.find((u) => u.position === position - 1);
    if (!prevUser) return null;
    return prevUser.total_points - currentPoints;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES').format(price);
  };

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
        <tr>
          <th className="px-2 py-2 rounded-l-lg">Pos</th>
          <th className="px-2 py-2">Usuario</th>
          <th
            className="px-2 py-2 text-right cursor-pointer hover:text-foreground transition-colors rounded-r-lg whitespace-nowrap"
            onClick={() => handleSort('total_points')}
          >
            Puntos {getSortIndicator('total_points')}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedStandings.map((user, idx) => {
          const pointsGap = getPointsGap(user.total_points, user.position);
          return (
            <tr
              key={user.user_id}
              className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
            >
              <td className="px-2 py-2 font-medium text-foreground text-xs">#{user.position}</td>
              <td className="px-2 py-2">
                <Link
                  href={`/user/${user.user_id}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <UserAvatar src={user.icon} alt={user.name} size={20} />
                  <span className="truncate max-w-[100px] sm:max-w-none text-xs hover:text-blue-400 transition-colors">
                    {user.name}
                  </span>
                </Link>
              </td>
              <td className="px-2 py-2 text-right">
                <div className="font-bold text-orange-500 text-sm">{user.total_points}</div>
                {pointsGap !== null && (
                  <div className="text-xs text-red-400 font-medium">-{pointsGap}</div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

StandingsTable.propTypes = {
  /** Array of standings data with user info, points, and team value */
  standings: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      icon: PropTypes.string,
      position: PropTypes.number.isRequired,
      total_points: PropTypes.number.isRequired,
      team_value: PropTypes.number.isRequired,
      price_trend: PropTypes.number,
    })
  ).isRequired,
};

export default memo(StandingsTable);
