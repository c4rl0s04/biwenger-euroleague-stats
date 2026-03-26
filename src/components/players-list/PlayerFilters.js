import { Search, X, SortAsc, SortDesc, LayoutGrid, List, Euro, RotateCcw } from 'lucide-react';
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
  return (
    <ElegantCard hideHeader padding="p-4" className="mb-6 relative z-30 overflow-visible">
      <div className="flex flex-col xl:flex-row gap-4 items-end">
        {/* Search */}
        <div className="w-full xl:w-72 shrink-0 space-y-1.5 flex gap-2 items-end">
          <div className="relative w-full">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-1.5 block">
              BUSCAR
            </span>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="text"
                placeholder="Nombre, equipo..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[40px] bg-secondary/50 border border-border/50 rounded-lg pl-10 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-secondary/50 rounded-lg p-1 border border-border/50 shrink-0 h-[40px] items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vista Lista"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-row flex-wrap xl:flex-nowrap gap-3 w-full items-end">
          {/* Team */}
          <div className="w-[48%] md:w-auto md:min-w-[130px] shrink-0 space-y-1.5">
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
          <div className="w-[48%] md:w-auto md:min-w-[120px] shrink-0 space-y-1.5">
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
          <div className="w-[30%] md:w-auto md:min-w-[110px] shrink-0 space-y-1.5">
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
          <div className="w-[30%] md:w-auto md:min-w-[110px] shrink-0 space-y-1.5">
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
          <div className="w-[30%] md:w-auto md:min-w-[100px] shrink-0 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              ORDENAR
            </span>
            <CustomSelect
              value={sortConfig.key}
              onChange={handleSort}
              options={[
                { value: 'total_points', label: 'Puntos' },
                { value: 'average', label: 'Media' },
                { value: 'price', label: 'Valor' },
                { value: 'name', label: 'Nombre' },
                { value: 'best_score', label: 'Mejor Partido' },
                { value: 'worst_score', label: 'Peor Partido' },
              ]}
            />
          </div>

          {/* Sort Direction */}
          <div className="shrink-0 space-y-1.5">
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
              className="h-[40px] w-[40px] flex items-center justify-center bg-secondary/50 border border-border/50 rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
              title={sortConfig.direction === 'asc' ? 'Ascendente' : 'Descendente'}
            >
              {sortConfig.direction === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
            </button>
          </div>

          {/* Price Filter */}
          <div className="w-full md:w-auto md:min-w-[100px] flex-1 min-w-[120px] shrink-0 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
              PRECIO MÁX.
            </span>
            <div className="relative">
              <Euro
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <input
                type="number"
                placeholder="Sin límite"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[40px] bg-secondary/50 border border-border/50 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="shrink-0 space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground ml-1 opacity-0 select-none">
              .
            </span>
            <button
              onClick={handleResetFilters}
              className="h-[40px] px-3 flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all cursor-pointer font-bold text-xs uppercase tracking-wider"
              title="Limpiar Filtros"
            >
              <RotateCcw size={16} />
              <span className="hidden xl:inline">Limpiar</span>
            </button>
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}
