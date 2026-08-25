'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  X,
  SortAsc,
  SortDesc,
  LayoutGrid,
  List,
  Euro,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function PlayerFilters({
  search,
  setSearch,
  teamFilter,
  setTeamFilter,
  ownerFilter,
  setOwnerFilter,
  positionFilter,
  setPositionFilter,
  statusFilter,
  setStatusFilter,
  sortConfig,
  setSortConfig,
  viewMode,
  setViewMode,
  maxPrice,
  setMaxPrice,
  teams,
  owners,
  handleSort,
  handleResetFilters,
  setCurrentPage,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = [
    search,
    teamFilter !== 'ALL',
    ownerFilter !== 'ALL',
    positionFilter !== 'ALL',
    statusFilter !== 'ALL',
    maxPrice,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!filtersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [filtersOpen]);

  return (
    <ElegantCard hideHeader padding="p-3" className="mb-6 relative z-30 overflow-visible">
      <button
        type="button"
        onClick={() => setFiltersOpen(true)}
        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-4 text-sm font-bold md:hidden"
        aria-expanded={filtersOpen}
        aria-controls="mobile-player-filters"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={18} aria-hidden="true" />
          Filtros
        </span>
        <span className="rounded-full bg-primary/15 px-2 py-1 text-xs text-primary">
          {activeFilters ? `${activeFilters} activos` : 'Todos'}
        </span>
      </button>

      {filtersOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[119] bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setFiltersOpen(false)}
          aria-label="Cerrar filtros"
        />
      )}

      {/* Unified Filter Row - Full width distribution */}
      <div
        id="mobile-player-filters"
        role={filtersOpen ? 'dialog' : undefined}
        aria-modal={filtersOpen || undefined}
        aria-label="Filtros de jugadores"
        className={`${filtersOpen ? 'flex' : 'hidden'} fixed inset-x-0 bottom-0 z-[120] max-h-[88dvh] flex-row flex-wrap items-end justify-between gap-x-2 gap-y-4 overflow-y-auto rounded-t-3xl border-t border-white/10 bg-zinc-950 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl md:static md:flex md:max-h-none md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none xl:flex-nowrap xl:gap-x-0`}
      >
        <div className="flex w-full items-center justify-between md:hidden">
          <div>
            <p className="font-bold text-white">Filtrar jugadores</p>
            <p className="text-xs text-muted-foreground">Ajusta la búsqueda y el orden</p>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/5"
            aria-label="Cerrar filtros"
          >
            <X size={20} />
          </button>
        </div>
        {/* Search */}
        <div className="w-full md:w-[220px] shrink-0 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-1 block">
            BUSCAR
          </span>
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="text"
              placeholder="Nombre..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-[38px] bg-secondary/50 border border-border/50 rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50 text-xs"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-secondary/50 rounded-lg p-0.5 border border-border/50 shrink-0 h-[38px] items-center">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List size={16} />
          </button>
        </div>

        {/* Team */}
        <div className="w-full shrink-0 space-y-1 sm:w-[48%] md:w-[135px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            EQUIPO
          </span>
          <CustomSelect
            value={teamFilter}
            onChange={(val) => {
              setTeamFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Todos' },
              ...teams.map((t) => ({ value: String(t.id), label: t.name })),
            ]}
            placeholder="Todos"
          />
        </div>

        {/* Owner */}
        <div className="w-full shrink-0 space-y-1 overflow-hidden text-ellipsis sm:w-[48%] md:w-[115px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            MANAGER
          </span>
          <CustomSelect
            value={ownerFilter}
            onChange={(val) => {
              setOwnerFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Todos' },
              ...owners.map((o) => ({ value: String(o.id), label: o.name })),
            ]}
            placeholder="Todos"
          />
        </div>

        {/* Position */}
        <div className="w-full shrink-0 space-y-1 sm:w-[48%] md:w-[105px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            POSICIÓN
          </span>
          <CustomSelect
            value={positionFilter}
            onChange={(val) => {
              setPositionFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Todas' },
              { value: 'Base', label: 'Bases' },
              { value: 'Alero', label: 'Aleros' },
              { value: 'Pivot', label: 'Pívots' },
            ]}
          />
        </div>

        {/* Status */}
        <div className="w-full shrink-0 space-y-1 sm:w-[48%] md:w-[105px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            ESTADO
          </span>
          <CustomSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Todos' },
              { value: 'OWNED', label: 'Fichados' },
              { value: 'FREE', label: 'Libres' },
            ]}
          />
        </div>

        {/* Sort Key */}
        <div className="w-full shrink-0 space-y-1 sm:w-[48%] md:w-[120px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            ORDENAR
          </span>
          <CustomSelect
            value={sortConfig.key}
            onChange={handleSort}
            options={[
              { value: 'total_points', label: 'Puntos' },
              { value: 'average', label: 'Media' },
              { value: 'avg_form_score', label: 'Forma' },
              { value: 'price', label: 'Valor' },
              { value: 'name', label: 'Nombre' },
              { value: 'best_score', label: 'Mejor' },
              { value: 'worst_score', label: 'Peor' },
            ]}
          />
        </div>

        {/* Sort Direction */}
        <div className="shrink-0 space-y-1">
          <span className="text-xs font-medium text-muted-foreground ml-1 opacity-0 select-none">
            .
          </span>
          <button
            onClick={() =>
              setSortConfig((c) => ({
                ...c,
                direction: c.direction === 'asc' ? 'desc' : 'asc',
              }))
            }
            className="h-[38px] w-[38px] flex items-center justify-center bg-secondary/50 border border-border/50 rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            {sortConfig.direction === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
          </button>
        </div>

        {/* Price Filter */}
        <div className="w-full md:w-[100px] shrink-0 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
            PRECIO
          </span>
          <div className="relative">
            <Euro
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={12}
            />
            <input
              type="number"
              placeholder="Máx"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-[38px] bg-secondary/50 border border-border/50 rounded-lg pl-7 pr-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="shrink-0 space-y-1">
          <span className="text-xs font-medium text-muted-foreground ml-1 opacity-0 select-none">
            .
          </span>
          <button
            onClick={handleResetFilters}
            className="h-[38px] px-2.5 flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all cursor-pointer font-bold text-[10px] uppercase tracking-wider"
            title="Limpiar Filtros"
          >
            <RotateCcw size={14} />
            <span className="hidden 2xl:inline">Limpiar</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="min-h-11 w-full rounded-xl bg-primary px-4 text-sm font-bold text-white md:hidden"
        >
          Ver resultados
        </button>
      </div>
    </ElegantCard>
  );
}
