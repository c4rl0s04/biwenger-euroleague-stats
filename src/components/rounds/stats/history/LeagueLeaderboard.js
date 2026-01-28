'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Plus, Check } from 'lucide-react';

/**
 * LeagueLeaderboard - Aggregated stats for all users with sorting
 * Shows: Rank, User, Avg Efficiency, Total Lost, Best Round, Worst Round
 * Clicking a row adds user to comparison
 */
export default function LeagueLeaderboard({
  leaderboardData = [],
  users = [],
  comparisonUserIds = [],
  onToggleUser = () => {},
  loading = false,
}) {
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

  const sortedData = useMemo(() => {
    const data = [...leaderboardData];
    data.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // Handle string values
      if (typeof aVal === 'string') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return data;
  }, [leaderboardData, sortKey, sortDir]);

  const renderSortHeader = (label, sortKeyName, align = 'left') => {
    const isActive = sortKey === sortKeyName;
    return (
      <th
        key={sortKeyName}
        className={`py-3 px-2 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
        onClick={() => handleSort(sortKeyName)}
      >
        <span className="inline-flex items-center gap-1">
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
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 px-2 font-semibold text-muted-foreground text-left w-12">#</th>
            <th className="py-3 px-2 font-semibold text-muted-foreground text-left">Usuario</th>
            {renderSortHeader('Eficiencia', 'avgEfficiency', 'right')}
            {renderSortHeader('Perdidos', 'totalLost', 'right')}
            {renderSortHeader('Mejor', 'bestActual', 'right')}
            {renderSortHeader('Peor', 'worstActual', 'right')}
            <th className="py-3 px-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => {
            const user = users.find((u) => u.id === row.userId);
            const isInComparison = comparisonUserIds.includes(row.userId);
            const effColor =
              parseFloat(row.avgEfficiency) >= 90
                ? 'text-emerald-400'
                : parseFloat(row.avgEfficiency) >= 75
                  ? 'text-yellow-400'
                  : 'text-red-400';

            return (
              <tr
                key={row.userId}
                className={`border-b border-border/50 transition-colors ${isInComparison ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
              >
                <td className="py-2.5 px-2 text-muted-foreground font-medium">{index + 1}</td>
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                      {user?.icon && (
                        <img
                          src={user.icon}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <span className="text-foreground font-medium truncate">
                      {user?.name || 'Usuario'}
                    </span>
                  </div>
                </td>
                <td className={`py-2.5 px-2 text-right font-medium ${effColor}`}>
                  {row.avgEfficiency}%
                </td>
                <td className="py-2.5 px-2 text-right text-red-400">-{row.totalLost}</td>
                <td className="py-2.5 px-2 text-right text-emerald-400">{row.bestActual}</td>
                <td className="py-2.5 px-2 text-right text-orange-400">{row.worstActual}</td>
                <td className="py-2.5 px-2">
                  <button
                    onClick={() => onToggleUser(row.userId)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isInComparison
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                    }`}
                    title={isInComparison ? 'Quitar de comparación' : 'Añadir a comparación'}
                  >
                    {isInComparison ? <Check size={12} /> : <Plus size={12} />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
