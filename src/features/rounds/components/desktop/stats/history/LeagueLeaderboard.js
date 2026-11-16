'use client';

import { Skeleton } from '@/components/ui/foundation';

import { useState, useMemo } from 'react';
import { Avatar, Button } from '@/components/ui/foundation';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Returns a color class based on efficiency value (0-100)
 */
function getEfficiencyColor(efficiency) {
  const eff = parseFloat(efficiency) || 0;
  if (eff >= 95) return 'text-[var(--round-ideal)]';
  if (eff >= 90) return 'text-[var(--round-ideal)]';
  if (eff >= 85) return 'text-[var(--round-ideal)]';
  if (eff >= 80) return 'text-[var(--round-record)]';
  if (eff >= 75) return 'text-[var(--round-record)]';
  if (eff >= 70) return 'text-primary';
  return 'text-[var(--round-danger)]';
}

/**
 * LeagueLeaderboard - Aggregated stats for all users with sorting
 * Shows: Rank, User, Avg Efficiency, Total Lost, Best/Worst Points, Best/Worst Efficiency
 */
export default function LeagueLeaderboard({ leaderboardData = [], users = [], loading = false }) {
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
        aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSort(sortKeyName)}
          className="inline-flex items-center gap-1 justify-end"
        >
          {label}
          {isActive && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </Button>
      </th>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-secondary rounded" />
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
      <table
        aria-label="Clasificación por eficiencia"
        className="w-full min-w-[42rem] text-sm table-fixed"
      >
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

            const effColor = getEfficiencyColor(row.avgEfficiency);

            return (
              <tr
                key={row.userId}
                className="border-b border-border/50 transition-colors hover:bg-secondary"
              >
                <td className="py-2 px-2 text-muted-foreground font-medium text-sm">{index + 1}</td>
                <td className="py-2 px-2">
                  <a
                    href={`/user/${row.userId}`}
                    className="flex min-w-0 items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Avatar src={user?.icon} alt="" size="sm" fallback={user?.name?.slice(0, 1)} />
                    <span className="truncate text-sm font-medium text-foreground">
                      {user?.name || 'Usuario'}
                    </span>
                  </a>
                </td>
                <td className={`py-2 px-2 text-right font-medium text-sm ${effColor}`}>
                  {row.avgEfficiency}%
                </td>
                <td className="py-2 px-2 text-right text-[var(--round-danger)] text-sm">
                  -{row.totalLost}
                </td>
                <td className="py-2 px-2 text-right text-[var(--round-ideal)] text-sm">
                  {row.bestActual}
                </td>
                <td className="py-2 px-2 text-right text-primary text-sm">{row.worstActual}</td>
                <td className="py-2 px-2 text-right text-sm">
                  <span className="text-[var(--round-ideal)]">{row.bestEfficiency}%</span>
                  {row.bestEffRound && (
                    <span className="text-muted-foreground text-[10px] ml-0.5">
                      (J{row.bestEffRound})
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-right text-sm">
                  <span className="text-primary">{row.worstEfficiency}%</span>
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
