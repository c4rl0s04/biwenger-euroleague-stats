'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * Returns a color class based on efficiency value (0-100)
 */
function getEfficiencyColor(efficiency) {
  const eff = parseFloat(efficiency) || 0;
  if (eff >= 95) return 'text-emerald-400';
  if (eff >= 90) return 'text-emerald-500';
  if (eff >= 85) return 'text-lime-400';
  if (eff >= 80) return 'text-yellow-400';
  if (eff >= 75) return 'text-amber-400';
  if (eff >= 70) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * LeagueLeaderboard - Aggregated stats for all users with sorting
 * Shows: Rank, User, Avg Efficiency, Total Lost, Best/Worst Points, Best/Worst Efficiency
 */
export default function LeagueLeaderboard({ leaderboardData = [], users = [], loading = false }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState('avgEfficiency');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleUserClick = (userId) => {
    router.push(`/user/${userId}`);
  };

  const sortedData = useMemo(() => {
    const data = [...leaderboardData];
    data.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (typeof aVal === 'string') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return data;
  }, [leaderboardData, sortKey, sortDir]);

  const renderSortHeader = (label, sortKeyName, width) => {
    const isActive = sortKey === sortKeyName;
    return (
      <th
        key={sortKeyName}
        style={{ width }}
        className="py-3 px-2 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-right"
        onClick={() => handleSort(sortKeyName)}
      >
        <span className="inline-flex items-center gap-1 justify-end">
          {label}
          {isActive && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </span>
      </th>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded" />
        ))}
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No hay datos de clasificación disponibles
      </div>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-border">
            <th
              style={{ width: '36px' }}
              className="py-3 px-2 font-semibold text-muted-foreground text-left"
            >
              #
            </th>
            <th
              style={{ width: '130px' }}
              className="py-3 px-2 font-semibold text-muted-foreground text-left"
            >
              Usuario
            </th>
            {renderSortHeader('Eff', 'avgEfficiency', '60px')}
            {renderSortHeader('Perdidos', 'totalLost', '65px')}
            {renderSortHeader('Mejor', 'bestActual', '55px')}
            {renderSortHeader('Peor', 'worstActual', '55px')}
            {renderSortHeader('Mejor Eff', 'bestEfficiency', '85px')}
            {renderSortHeader('Peor Eff', 'worstEfficiency', '85px')}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => {
            const user = users.find((u) => u.id === row.userId);
            const userColor = getColorForUser(row.userId, user?.name, user?.color_index);
            const effColor = getEfficiencyColor(row.avgEfficiency);

            return (
              <tr
                key={row.userId}
                className="border-b border-border/50 transition-colors hover:bg-white/5"
              >
                <td className="py-2 px-2 text-muted-foreground font-medium text-sm">{index + 1}</td>
                <td className="py-2 px-2">
                  <div
                    className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
                    onClick={() => handleUserClick(row.userId)}
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                      {user?.icon && (
                        <Image
                          src={user.icon}
                          alt={user.name}
                          width={24}
                          height={24}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <span className={`font-medium truncate text-sm ${userColor.text}`}>
                      {user?.name || 'Usuario'}
                    </span>
                  </div>
                </td>
                <td className={`py-2 px-2 text-right font-medium text-sm ${effColor}`}>
                  {row.avgEfficiency}%
                </td>
                <td className="py-2 px-2 text-right text-red-400 text-sm">-{row.totalLost}</td>
                <td className="py-2 px-2 text-right text-emerald-400 text-sm">{row.bestActual}</td>
                <td className="py-2 px-2 text-right text-orange-400 text-sm">{row.worstActual}</td>
                <td className="py-2 px-2 text-right text-sm">
                  <span className="text-emerald-400">{row.bestEfficiency}%</span>
                  {row.bestEffRound && (
                    <span className="text-muted-foreground text-[10px] ml-0.5">
                      (J{row.bestEffRound})
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-right text-sm">
                  <span className="text-orange-400">{row.worstEfficiency}%</span>
                  {row.worstEffRound && (
                    <span className="text-muted-foreground text-[10px] ml-0.5">
                      (J{row.worstEffRound})
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
