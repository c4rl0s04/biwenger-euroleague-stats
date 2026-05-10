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

  // Group players by position
  const groupedSquad = POSITIONS.reduce((acc, pos) => {
    acc[pos] = squad
      .filter((p) => p.position === pos)
      .sort((a, b) => (b.points || 0) - (a.points || 0));
    return acc;
  }, {});

  const toggleSection = (pos) => {
    setExpanded((prev) => ({ ...prev, [pos]: !prev[pos] }));
  };

  const renderTrend = (trend) => {
    if (!trend) return <Minus className="w-3 h-3 text-zinc-500 mx-auto" />;
    const val = parseInt(trend);
    if (val > 0)
      return (
        <div className="flex items-center justify-center gap-1 text-emerald-400">
          <TrendingUp className="w-3 h-3" />
          <span className="text-[10px] font-bold">+{(val / 1000).toFixed(0)}k</span>
        </div>
      );
    if (val < 0)
      return (
        <div className="flex items-center justify-center gap-1 text-rose-400">
          <TrendingDown className="w-3 h-3" />
          <span className="text-[10px] font-bold">{(val / 1000).toFixed(0)}k</span>
        </div>
      );
    return <Minus className="w-3 h-3 text-zinc-500 mx-auto" />;
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

  const renderStatus = (status) => {
    if (!status || status === 'ok')
      return <Activity className="w-3.5 h-3.5 text-emerald-500 mx-auto opacity-40" />;
    if (status === 'injured')
      return <AlertCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" title="Lesionado" />;
    if (status === 'doubtful')
      return <AlertCircle className="w-3.5 h-3.5 text-amber-500 mx-auto" title="Duda" />;
    return <AlertCircle className="w-3.5 h-3.5 text-zinc-500 mx-auto" />;
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
                            className="text-zinc-500 border-none pb-2 w-[35%]"
                          >
                            Jugador
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="center"
                            className="text-zinc-500 border-none pb-2 w-[10%]"
                          >
                            Media
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="center"
                            className="text-zinc-500 border-none pb-2 w-[10%]"
                          >
                            Puntos
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="center"
                            className="text-zinc-500 border-none pb-2 w-[20%]"
                          >
                            Forma
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="text-zinc-500 border-none pb-2 w-[15%]"
                          >
                            Valor
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="center"
                            className="text-zinc-500 border-none pb-2 w-[10%]"
                          >
                            Tend.
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
                              className="border-none font-mono text-zinc-200 font-black text-sm"
                            >
                              {player.average || 0}
                            </TableCell>
                            <TableCell
                              align="center"
                              className="border-none text-zinc-400 font-bold text-sm"
                            >
                              {player.points || 0}
                            </TableCell>
                            <TableCell align="center" className="border-none">
                              {renderForma(player.recent_scores)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="border-none text-zinc-200 font-bold text-sm whitespace-nowrap"
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
