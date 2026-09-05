'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { House, Plane, Swords, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ElegantCard } from '@/components/ui';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
} from '@/components/ui/StatsTable';
import { getScoreColor } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

function SortIcon({ columnKey, sortConfig }) {
  if (sortConfig.key !== columnKey) return <ArrowUpDown size={8} className="ml-1 opacity-20" />;
  return sortConfig.direction === 'asc' ? (
    <ArrowUp size={8} className="ml-1 text-primary" />
  ) : (
    <ArrowDown size={8} className="ml-1 text-primary" />
  );
}

export default function PlayerHistoryCard({ recentMatches, playerTeam, className = '' }) {
  const [sortConfig, setSortConfig] = useState({ key: 'round_id', direction: 'desc' });
  const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

  const sortedMatches = useMemo(() => {
    let sortableItems = [...(recentMatches || [])];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) aValue = -1;
        if (bValue === null || bValue === undefined) bValue = -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [recentMatches, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <ElegantCard hideHeader padding="p-0" className={`overflow-hidden border-white/5 ${className}`}>
      <Table tableClassName="table-fixed">
        <TableHeader>
          <TableRow hovering={false}>
            <TableHeaderCell
              align="left"
              className="pl-1.5 pr-1 font-bold text-[10px] tracking-widest text-white/80 cursor-pointer hover:bg-white/5 transition-colors w-[10%]"
              onClick={() => requestSort('round_id')}
            >
              <div className="flex items-center">
                JORNADA <SortIcon columnKey="round_id" sortConfig={sortConfig} />
              </div>
            </TableHeaderCell>
            <TableHeaderCell
              align="left"
              className="px-1 font-bold text-[10px] tracking-widest text-white/80 w-[14%]"
            >
              RIVAL
            </TableHeaderCell>
            <TableHeaderCell className="px-1 font-bold text-[10px] tracking-widest text-white/80 w-[5%]">
              SEDE
            </TableHeaderCell>
            <TableHeaderCell
              className="px-1 font-bold text-[10px] tracking-widest text-orange-400 cursor-pointer hover:bg-orange-400/10 transition-colors w-[7%]"
              onClick={() => requestSort('fantasy_points')}
            >
              <div className="flex items-center justify-center">
                PTS <SortIcon columnKey="fantasy_points" sortConfig={sortConfig} />
              </div>
            </TableHeaderCell>
            <TableHeaderCell
              className="px-1 font-bold text-[10px] tracking-widest text-slate-400 cursor-pointer hover:bg-slate-400/10 transition-colors w-[6%]"
              onClick={() => requestSort('minutes_played')}
            >
              <div className="flex items-center justify-center">
                MIN <SortIcon columnKey="minutes_played" sortConfig={sortConfig} />
              </div>
            </TableHeaderCell>
            <TableHeaderCell
              className="hidden md:table-cell px-1 font-bold text-[10px] tracking-widest text-white/80 cursor-pointer hover:bg-white/5 transition-colors w-[5%]"
              onClick={() => requestSort('points_scored')}
            >
              <div className="flex items-center justify-center">
                RP <SortIcon columnKey="points_scored" sortConfig={sortConfig} />
              </div>
            </TableHeaderCell>
            <TableHeaderCell
              className="hidden lg:table-cell px-1 font-bold text-[10px] tracking-widest text-blue-400 cursor-pointer hover:bg-blue-400/10 transition-colors w-[5%]"
              onClick={() => requestSort('rebounds')}
            >
              <div className="flex items-center justify-center">
                REB <SortIcon columnKey="rebounds" sortConfig={sortConfig} />
              </div>
            </TableHeaderCell>
            <TableHeaderCell
              className="hidden lg:table-cell px-1 font-bold text-[10px] tracking-widest text-emerald-400 cursor-pointer hover:bg-emerald-400/10 transition-colors w-[5%]"
              onClick={() => requestSort('assists')}
            >
              <div className="flex items-center justify-center">
                AST <SortIcon columnKey="assists" sortConfig={sortConfig} />
              </div>
            </TableHeaderCell>
            <TableHeaderCell className="hidden xl:table-cell px-1 font-bold text-[10px] tracking-widest text-pink-400/80 w-[7%]">
              T2
            </TableHeaderCell>
            <TableHeaderCell className="hidden xl:table-cell px-1 font-bold text-[10px] tracking-widest text-purple-400/80 w-[7%]">
              T3
            </TableHeaderCell>
            <TableHeaderCell className="hidden xl:table-cell px-1 font-bold text-[10px] tracking-widest text-cyan-400/80 w-[7%]">
              TL
            </TableHeaderCell>
            <TableHeaderCell
              className="hidden xl:table-cell px-1 font-bold text-[10px] tracking-widest text-amber-400/80 cursor-pointer hover:bg-amber-400/10 transition-colors w-[5%]"
              onClick={() => requestSort('blocks')}
            >
              <div className="flex items-center justify-center">
                TAP <SortIcon columnKey="blocks" sortConfig={sortConfig} />
              </div>
            </TableHeaderCell>
            <TableHeaderCell
              className="hidden xl:table-cell px-1 font-bold text-[10px] tracking-widest text-red-400/80 cursor-pointer hover:bg-red-400/10 transition-colors w-[5%]"
              onClick={() => requestSort('turnovers')}
            >
              <div className="flex items-center justify-center">
                PER <SortIcon columnKey="turnovers" sortConfig={sortConfig} />
              </div>
            </TableHeaderCell>
            <TableHeaderCell
              className="pr-1.5 pl-1 font-bold text-[10px] tracking-widest text-indigo-400 cursor-pointer hover:bg-indigo-400/10 transition-colors w-[7%]"
              onClick={() => requestSort('valuation')}
            >
              <div className="flex items-center justify-center">
                VAL <SortIcon columnKey="valuation" sortConfig={sortConfig} />
              </div>
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <tbody className="divide-y divide-white/5">
          {sortedMatches?.map((match) => {
            const pTeamNorm = normalize(playerTeam);
            const hTeamNorm = normalize(match.home_team);
            const isHome =
              pTeamNorm &&
              hTeamNorm &&
              (pTeamNorm === hTeamNorm ||
                pTeamNorm.includes(hTeamNorm) ||
                hTeamNorm.includes(pTeamNorm));

            const rivalName = isHome ? match.away_team : match.home_team;
            const rivalImg = isHome ? match.away_img : match.home_img;
            const rivalId = isHome ? match.away_id : match.home_id;
            const played = match.minutes_played > 0 || match.fantasy_points !== null;

            return (
              <TableRow key={match.round_id} className={!played ? 'opacity-30 grayscale' : ''}>
                <TableCell align="left" className="pl-1.5 pr-1 py-2.5">
                  <span className="text-xs font-bold text-white tracking-tighter whitespace-nowrap">
                    {match.round_name || `Jornada ${match.round_id}`}
                  </span>
                </TableCell>
                <TableCell align="left" className="px-1 py-2.5">
                  <Link href={`/team/${rivalId}`} className="flex items-center gap-1 group/rival">
                    {rivalImg ? (
                      <div className="relative w-5.5 h-5.5 shrink-0 transition-transform group-hover/rival:scale-110">
                        <Image src={rivalImg} alt="" fill className="object-contain" unoptimized />
                      </div>
                    ) : (
                      <div className="w-5.5 h-5.5 rounded bg-white/5 flex items-center justify-center border border-white/10 group-hover/rival:border-primary/50">
                        <Swords
                          size={10}
                          className="text-white/20 group-hover/rival:text-primary/50"
                        />
                      </div>
                    )}
                    <span className="text-xs font-bold text-white uppercase tracking-tighter truncate max-w-[60px] lg:max-w-none transition-colors group-hover/rival:text-primary">
                      {rivalName}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="px-1 py-2.5">
                  <div className="flex justify-center">
                    <div
                      className={`p-1 rounded border transition-colors ${
                        isHome
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}
                    >
                      {isHome ? <House size={11} /> : <Plane size={11} />}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-1 py-2.5">
                  {played ? (
                    <div
                      className={cn(
                        'inline-flex items-center justify-center min-w-[30px] h-7 rounded font-display text-sm px-1 border shadow-md',
                        getScoreColor(match.fantasy_points)
                      )}
                    >
                      {match.fantasy_points}
                    </div>
                  ) : (
                    <span className="text-white/10 font-bold text-xs tracking-tighter">-</span>
                  )}
                </TableCell>
                <TableCell className="px-1 py-2.5">
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tighter',
                      played ? 'text-slate-400' : 'text-white/10'
                    )}
                  >
                    {played ? `${match.minutes_played || 0}'` : '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell px-1 py-2.5">
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tighter',
                      played ? 'text-white' : 'text-white/10'
                    )}
                  >
                    {played ? match.points_scored || 0 : '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell px-1 py-2.5">
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tighter',
                      played ? 'text-blue-400' : 'text-white/10'
                    )}
                  >
                    {played ? match.rebounds || 0 : '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell px-1 py-2.5">
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tighter',
                      played ? 'text-emerald-400' : 'text-white/10'
                    )}
                  >
                    {played ? match.assists || 0 : '-'}
                  </span>
                </TableCell>

                {/* Advanced Stats */}
                <TableCell className="hidden xl:table-cell px-1 py-2.5">
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tighter',
                      played ? 'text-pink-400/90' : 'text-white/10'
                    )}
                  >
                    {played
                      ? `${match.two_points_made || 0}/${match.two_points_attempted || 0}`
                      : '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden xl:table-cell px-1 py-2.5">
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tighter',
                      played ? 'text-purple-400/90' : 'text-white/10'
                    )}
                  >
                    {played
                      ? `${match.three_points_made || 0}/${match.three_points_attempted || 0}`
                      : '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden xl:table-cell px-1 py-2.5">
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tighter',
                      played ? 'text-cyan-400/90' : 'text-white/10'
                    )}
                  >
                    {played
                      ? `${match.free_throws_made || 0}/${match.free_throws_attempted || 0}`
                      : '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden xl:table-cell px-1 py-2.5">
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tighter',
                      played ? 'text-amber-400/90' : 'text-white/10'
                    )}
                  >
                    {played ? match.blocks || 0 : '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden xl:table-cell px-1 py-2.5">
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tighter',
                      played ? 'text-red-400/90' : 'text-white/10'
                    )}
                  >
                    {played ? match.turnovers || 0 : '-'}
                  </span>
                </TableCell>

                <TableCell className="pr-1.5 pl-1 py-2.5">
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tighter',
                      played ? 'text-indigo-400' : 'text-white/10'
                    )}
                  >
                    {played ? match.valuation || 0 : '-'}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </tbody>
      </Table>
    </ElegantCard>
  );
}
