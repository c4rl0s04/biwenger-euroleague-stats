'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  SortAsc,
  SortDesc,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Euro,
  LayoutGrid,
  List,
} from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import PlayerCard from './PlayerCard';
import PlayersList from './PlayersList';

// 21 items to fit perfectly in a 3-column grid (7 rows x 3 cols)
const ITEMS_PER_PAGE = 21;

export default function PlayersTable({ initialPlayers }) {
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'total_points', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // --- FILTER OPTIONS LOGIC ---
  const teams = useMemo(() => {
    const uniqueTeams = new Set(
      initialPlayers
        .filter((p) => p.team_name && p.team_id)
        .map((p) => JSON.stringify({ name: p.team_name, id: p.team_id }))
    );
    return Array.from(uniqueTeams)
      .map((t) => JSON.parse(t))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [initialPlayers]);

  const owners = useMemo(() => {
    const uniqueOwners = new Set(
      initialPlayers
        .filter((p) => p.owner_id && p.owner_name)
        .map((p) => JSON.stringify({ name: p.owner_name, id: p.owner_id }))
    );
    return Array.from(uniqueOwners)
      .map((o) => JSON.parse(o))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [initialPlayers]);

  // --- FILTERING & SORTING LOGIC ---
  const filteredPlayers = useMemo(() => {
    let result = [...initialPlayers];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.team_name?.toLowerCase().includes(q) ||
          p.owner_name?.toLowerCase().includes(q)
      );
    }

    // Position Filter
    if (positionFilter !== 'ALL') {
      result = result.filter((p) => p.position === positionFilter);
    }

    // Status Filter
    if (statusFilter === 'FREE') {
      result = result.filter((p) => !p.owner_id);
    } else if (statusFilter === 'OWNED') {
      result = result.filter((p) => p.owner_id);
    }

    // Team Filter
    if (teamFilter !== 'ALL') {
      result = result.filter((p) => String(p.team_id) === teamFilter);
    }

    // Owner Filter
    if (ownerFilter !== 'ALL') {
      result = result.filter((p) => String(p.owner_id) === ownerFilter);
    }

    // Price Filter
    if (maxPrice && !isNaN(maxPrice)) {
      result = result.filter((p) => p.price <= Number(maxPrice));
    }

    // Sorting
    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (aValue === null) aValue = -Infinity;
      if (bValue === null) bValue = -Infinity;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    initialPlayers,
    search,
    positionFilter,
    statusFilter,
    teamFilter,
    ownerFilter,
    maxPrice,
    sortConfig,
  ]);

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Helper for Summary stats (not card)
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* --- CONTROLS BAR --- */}
      <div className="relative z-20 bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border/50">
        <div className="flex flex-col xl:flex-row gap-4 items-end">
          {/* Search */}
          <div className="w-full xl:w-72 shrink-0 space-y-1.5 flex gap-2 items-end">
            <div className="relative w-full">
              <span className="text-xs font-medium text-muted-foreground ml-1 mb-1.5 block">
                Buscar
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
              <span className="text-xs font-medium text-muted-foreground ml-1">Equipo</span>
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
              <span className="text-xs font-medium text-muted-foreground ml-1">Manager</span>
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
              <span className="text-xs font-medium text-muted-foreground ml-1">Posición</span>
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
              <span className="text-xs font-medium text-muted-foreground ml-1">Estado</span>
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
              <span className="text-xs font-medium text-muted-foreground ml-1">Ordenar</span>
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
            <div className="w-full md:w-auto md:min-w-[100px] shrink-0 space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground ml-1">Precio máx.</span>
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
          </div>
        </div>
      </div>

      {/* --- STATS SUMMARY --- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card/30 p-4 rounded-xl border border-border/30">
          <div className="text-muted-foreground text-xs mb-1">Total Jugadores</div>
          <div className="text-2xl font-bold font-display">{initialPlayers.length}</div>
        </div>
        <div className="bg-card/30 p-4 rounded-xl border border-border/30">
          <div className="text-muted-foreground text-xs mb-1">Fichados</div>
          <div className="text-2xl font-bold font-display text-primary">
            {initialPlayers.filter((p) => p.owner_id).length}
          </div>
        </div>
        <div className="bg-card/30 p-4 rounded-xl border border-border/30">
          <div className="text-muted-foreground text-xs mb-1">Libres</div>
          <div className="text-2xl font-bold font-display text-green-400">
            {initialPlayers.filter((p) => !p.owner_id).length}
          </div>
        </div>
        <div className="bg-card/30 p-4 rounded-xl border border-border/30">
          <div className="text-muted-foreground text-xs mb-1">Valor Total</div>
          <div className="text-2xl font-bold font-display text-blue-400">
            {formatMoney(initialPlayers.reduce((acc, p) => acc + (p.price || 0), 0) / 1000000)}M
          </div>
        </div>
        <div className="bg-card/30 p-4 rounded-xl border border-border/30">
          <div className="text-muted-foreground text-xs mb-1">Puntos Totales</div>
          <div className="text-2xl font-bold font-display text-primary">
            {new Intl.NumberFormat('es-ES').format(
              initialPlayers.reduce((acc, p) => acc + (p.total_points || 0), 0)
            )}
          </div>
        </div>
      </div>

      {/* --- CARD GRID --- */}
      {/* --- CONTENT --- */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} sortConfig={sortConfig} />
          ))}
        </div>
      ) : (
        <PlayersList
          players={paginatedPlayers}
          sortConfig={sortConfig}
          onSort={handleSort}
          startIndex={(currentPage - 1) * ITEMS_PER_PAGE}
        />
      )}

      {/* --- EMPTY STATE --- */}
      {filteredPlayers.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No se encontraron jugadores</p>
          <p className="text-sm">Prueba con otros filtros o términos de búsqueda</p>
        </div>
      )}

      {/* --- PAGINATION --- */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-border/50 bg-secondary/30 rounded-b-xl gap-4">
          <div className="text-sm text-muted-foreground order-2 md:order-1">
            Mostrando{' '}
            <span className="font-medium text-foreground">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{' '}
            -{' '}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)}
            </span>{' '}
            de <span className="font-medium text-foreground">{filteredPlayers.length}</span>
          </div>

          <div className="flex gap-2 order-1 md:order-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1 bg-secondary/50 border border-border/50 rounded-lg px-3 hidden md:flex">
              <span className="text-sm font-medium">
                {currentPage} <span className="text-muted-foreground mx-1">/</span> {totalPages}
              </span>
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
