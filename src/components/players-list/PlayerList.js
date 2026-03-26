'use client';

import PlayerGridItem from './PlayerGridItem';
import PlayerRow from './PlayerRow';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PlayerList({
  players = [],
  viewMode = 'grid',
  currentPage = 1,
  totalPages = 1,
  setCurrentPage,
  sortConfig = {},
}) {
  if (players.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500 text-lg">No se han encontrado jugadores con estos filtros.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {players.map((player) => (
            <PlayerGridItem key={player.id} player={player} sortConfig={sortConfig} />
          ))}
        </div>
      ) : (
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/20 border-b border-border/20">
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Jugador
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Equipo
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Manager
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Valor
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">
                  Puntos
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">
                  {sortConfig?.key === 'best_score'
                    ? 'Mejor'
                    : sortConfig?.key === 'worst_score'
                      ? 'Peor'
                      : 'Media'}
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">
                  {sortConfig?.key === 'best_score' ? 'Media' : 'Mejor'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {players.map((player) => (
                <PlayerRow key={player.id} player={player} sortConfig={sortConfig} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-card/30 backdrop-blur-sm p-4 rounded-xl border border-border/50">
          <div className="text-sm text-muted-foreground">
            Página <span className="text-white font-bold">{currentPage}</span> de{' '}
            <span className="text-white font-bold">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border/50 hover:bg-secondary/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-border/50 hover:bg-secondary/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
