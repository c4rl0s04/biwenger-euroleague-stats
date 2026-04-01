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
    <ElegantCard hideHeader padding="p-3" className="mb-6 relative z-30 overflow-visible">
      {/* Unified Filter Row - Full width distribution */}
      <div className="flex flex-row flex-wrap xl:flex-nowrap gap-x-2 gap-y-4 xl:gap-x-0 w-full items-end justify-between">
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
        <div className="w-[48%] md:w-[135px] shrink-0 space-y-1">
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
        <div className="w-[48%] md:w-[115px] shrink-0 space-y-1 text-ellipsis overflow-hidden">
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
        <div className="w-[30%] md:w-[105px] shrink-0 space-y-1">
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
        <div className="w-[30%] md:w-[105px] shrink-0 space-y-1">
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
        <div className="w-[30%] md:w-[120px] shrink-0 space-y-1">
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
      </div>
    </ElegantCard>
  );
}
