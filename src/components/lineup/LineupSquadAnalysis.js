'use client';

import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableIdentity,
} from '@/components/ui/StatsTable';
import { ElegantCard } from '@/components/ui';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Activity,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { getScoreColor } from '@/lib/utils/format';

const POSITIONS = ['Base', 'Alero', 'Pivot'];
const POSITION_COLORS = {
  Base: {
    text: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    shadow: 'shadow-blue-400/5',
    line: 'from-blue-400/20',
  },
  Alero: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    shadow: 'shadow-emerald-400/5',
    line: 'from-emerald-400/20',
  },
  Pivot: {
    text: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
    shadow: 'shadow-rose-400/5',
    line: 'from-rose-400/20',
  },
};

export default function LineupSquadAnalysis({ squad = [], onPlayerClick }) {
  const [expanded, setExpanded] = useState({
    Base: true,
    Alero: true,
    Pivot: true,
  });
  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' });

  // Group players by position with sorting
  const groupedSquad = POSITIONS.reduce((acc, pos) => {
    const players = squad
      .filter((p) => p.position === pos)
      .map((p) => {
        // Calculate a numeric average for "Forma" sorting
        const scores = p.recent_scores
          ? p.recent_scores
              .split(',')
              .filter((s) => s !== 'X')
              .map(Number)
          : [];
        const formaAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return { ...p, forma_avg: formaAvg };
      });

    acc[pos] = [...players].sort((a, b) => {
      let aVal, bVal;

      // Extract and normalize values based on the sort key
      switch (sortConfig.key) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);

        case 'average':
          aVal = parseFloat(a.average) || 0;
          bVal = parseFloat(b.average) || 0;
          break;

        case 'points':
          aVal = parseInt(a.points) || 0;
          bVal = parseInt(b.points) || 0;
          break;

        case 'forma':
          aVal = a.forma_avg || 0;
          bVal = b.forma_avg || 0;
          break;

        case 'price':
          aVal = parseInt(a.price) || 0;
          bVal = parseInt(b.price) || 0;
          break;

        case 'price_increment':
          aVal = parseInt(a.price_increment) || 0;
          bVal = parseInt(b.price_increment) || 0;
          break;

        default:
          aVal = a[sortConfig.key] || 0;
          bVal = b[sortConfig.key] || 0;
      }

      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return acc;
  }, {});

  const toggleSection = (pos) => {
    setExpanded((prev) => ({ ...prev, [pos]: !prev[pos] }));
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? (
      <TrendingUp className="w-3 h-3 shrink-0" />
    ) : (
      <TrendingDown className="w-3 h-3 shrink-0" />
    );
  };

  const renderTrend = (trend) => {
    if (!trend) return <Minus className="w-3 h-3 text-zinc-500 mx-auto" />;
    const val = parseInt(trend);
    if (val > 0)
      return (
        <div className="flex items-center justify-center text-emerald-400">
          <span className="text-[11px] font-black">+{(val / 1000).toFixed(0)}k</span>
        </div>
      );
    if (val < 0)
      return (
        <div className="flex items-center justify-center text-rose-400">
          <span className="text-[11px] font-black">{(val / 1000).toFixed(0)}k</span>
        </div>
      );
    return <Minus className="w-3 h-3 text-zinc-500 mx-auto" />;
  };

  const renderStatus = (status) => {
    if (!status || status === 'ok') return null;
    if (status === 'injured')
      return <AlertCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" title="Lesionado" />;
    if (status === 'doubtful')
      return <AlertCircle className="w-3.5 h-3.5 text-amber-500 mx-auto" title="Duda" />;
    return <AlertCircle className="w-3.5 h-3.5 text-zinc-500 mx-auto" />;
  };

  const renderForma = (scoresStr) => {
    if (!scoresStr)
      return (
        <div className="flex gap-1 justify-center">
          <div className="w-5 h-5 rounded bg-zinc-800" />
        </div>
      );

    const scores = scoresStr.split(',').slice(0, 5);
    return (
      <div className="flex items-center justify-center gap-1">
        {scores.map((s, i) => (
          <div
            key={i}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-md border text-[11px] font-black transition-all shadow-sm',
              getScoreColor(s)
            )}
          >
            {s === 'X' ? '-' : s}
          </div>
        ))}
      </div>
    );
  };

  const formatPrice = (price) => {
    if (!price) return '0 €';
    return (price / 1000000).toFixed(2) + ' M€';
  };

  return (
    <ElegantCard title="Análisis de Plantilla" icon={BarChart3} color="zinc" className="mt-8">
      <div className="space-y-10">
        {POSITIONS.map((pos) => {
          const players = groupedSquad[pos];
          if (players.length === 0) return null;

          const colors = POSITION_COLORS[pos];
          const isExpanded = expanded[pos];

          return (
            <div key={pos} className="space-y-4">
              <button
                onClick={() => toggleSection(pos)}
                className="flex items-center gap-4 p-2 -mx-2 rounded-xl hover:bg-white/[0.03] transition-all w-[calc(100%+1rem)] group/header cursor-pointer"
              >
                <span
                  className={cn(
                    'text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border shadow-lg transition-all',
                    colors.text,
                    colors.bg,
                    colors.border,
                    colors.shadow,
                    isExpanded ? 'scale-100' : 'scale-95 opacity-60'
                  )}
                >
                  {pos}s
                </span>
                <div className={cn('h-px flex-1 bg-gradient-to-r to-transparent', colors.line)} />
                <div
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/5 transition-all group-hover/header:border-white/10 group-hover/header:bg-white/5',
                    !isExpanded && 'opacity-40'
                  )}
                >
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-white/60 transition-transform duration-300 drop-shadow-sm',
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <Table tableClassName="table-fixed">
                      <TableHeader>
                        <TableRow hovering={false} className="bg-transparent border-none">
                          <TableHeaderCell
                            align="left"
                            className="text-zinc-500 border-none pb-2 w-[35%] cursor-pointer hover:text-zinc-300 transition-colors"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              Jugador <SortIcon columnKey="name" />
                            </div>
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="center"
                            className="text-blue-400/60 border-none pb-2 w-[10%] cursor-pointer hover:text-blue-400 transition-colors"
                            onClick={() => handleSort('average')}
                          >
                            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                              Media <SortIcon columnKey="average" />
                            </div>
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="center"
                            className="text-amber-400/60 border-none pb-2 w-[10%] cursor-pointer hover:text-amber-400 transition-colors"
                            onClick={() => handleSort('points')}
                          >
                            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                              Puntos <SortIcon columnKey="points" />
                            </div>
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="center"
                            className="text-rose-400/60 border-none pb-2 w-[20%] cursor-pointer hover:text-rose-400 transition-colors"
                            onClick={() => handleSort('forma')}
                          >
                            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                              Forma <SortIcon columnKey="forma" />
                            </div>
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="text-emerald-400/60 border-none pb-2 w-[15%] cursor-pointer hover:text-emerald-400 transition-colors"
                            onClick={() => handleSort('price')}
                          >
                            <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                              Valor <SortIcon columnKey="price" />
                            </div>
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="center"
                            className="text-indigo-400/60 border-none pb-2 w-[10%] cursor-pointer hover:text-indigo-400 transition-colors"
                            onClick={() => handleSort('price_increment')}
                          >
                            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                              Tend. <SortIcon columnKey="price_increment" />
                            </div>
                          </TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <tbody>
                        {players.map((player) => (
                          <TableRow
                            key={player.id}
                            className="cursor-pointer hover:bg-white/[0.03] transition-all group border-b border-white/[0.02] last:border-none"
                            onClick={() => onPlayerClick?.(player)}
                          >
                            <TableCell align="left" className="py-4 border-none">
                              <TableIdentity
                                name={player.name}
                                image={player.img}
                                subtitle={player.team}
                                size="sm"
                                className="group-hover:translate-x-1 transition-transform"
                              />
                            </TableCell>
                            <TableCell
                              align="center"
                              className="border-none font-mono text-blue-400 font-black text-sm"
                            >
                              {player.average || 0}
                            </TableCell>
                            <TableCell
                              align="center"
                              className="border-none text-amber-400 font-bold text-sm"
                            >
                              {player.points || 0}
                            </TableCell>
                            <TableCell align="center" className="border-none">
                              {renderForma(player.recent_scores)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="border-none text-emerald-400 font-black text-base whitespace-nowrap"
                            >
                              {formatPrice(player.price)}
                            </TableCell>
                            <TableCell align="center" className="border-none">
                              <div className="flex flex-col items-center gap-1.5">
                                {renderTrend(player.price_increment)}
                                {renderStatus(player.status)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </tbody>
                    </Table>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </ElegantCard>
  );
}
