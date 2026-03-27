import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Euro } from 'lucide-react';
import { Section } from '@/components/layout';
import MarketPlayerCard from './MarketPlayerCard';
import CustomSelect from '@/components/ui/CustomSelect';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import ExpandedPlayerModal from './ExpandedPlayerModal';
export default function MarketListingsSection({ listings = [] }) {
  const [filterOwner, setFilterOwner] = useState('all'); // 'all', 'free', 'owned'
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlayerId, setExpandedPlayerId] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null); // For Level 2 Expansion

  // Extract unique teams and positions
  const availableTeams = useMemo(() => {
    const teams = new Set();
    listings.forEach((p) => {
      if (p.team) teams.add(p.team);
    });
    return Array.from(teams).sort((a, b) => a.localeCompare(b));
  }, [listings]);

  const availablePositions = useMemo(() => {
    const pos = new Set();
    listings.forEach((p) => {
      if (p.position) pos.add(p.position);
    });
    // Optional: Sort logically if we want: PT, DF, MC, DL
    return Array.from(pos).sort();
  }, [listings]);

  // Apply filters
  const filteredListings = useMemo(() => {
    return listings.filter((player) => {
      // Owner Logic
      const isFree =
        !player.seller_name || player.seller_name === 'Mercado' || player.seller_id === null;
      if (filterOwner === 'free' && !isFree) return false;
      if (filterOwner === 'owned' && isFree) return false;

      // Position
      if (filterPosition !== 'all' && player.position !== filterPosition) return false;

      // Team
      if (filterTeam !== 'all' && player.team !== filterTeam) return false;

      // Price
      if (maxPrice && player.price > parseInt(maxPrice)) return false;

      // Search Name
      if (searchQuery && !player.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        return false;

      return true;
    });
  }, [listings, filterOwner, filterPosition, filterTeam, maxPrice, searchQuery]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilterOwner('all');
    setFilterPosition('all');
    setFilterTeam('all');
    setMaxPrice('');
    setSearchQuery('');
  };

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <Section title="Jugadores en el Mercado" delay={50} background="section-base">
      {/* Filters Bar (Premium Elegant Style) */}
      <ElegantCard hideHeader padding="p-4" className="mb-6 relative z-20 overflow-visible">
        <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between">
          <div className="flex flex-row flex-wrap xl:flex-nowrap gap-3 w-full items-end">
            {/* Text Search */}
            <div className="flex w-full gap-2 items-end space-y-1.5 shrink-0 md:w-auto md:min-w-50">
              <div className="relative w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1.5 block">
                  BUSCAR
                </span>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Nombre..."
                    className="h-10 w-full rounded-lg border border-border/50 bg-secondary/50 py-2 pl-9 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Owner Filter */}
            <div className="w-[48%] shrink-0 space-y-1.5 md:w-auto md:min-w-35">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                PROPIEDAD
              </span>
              <CustomSelect
                value={filterOwner}
                onChange={setFilterOwner}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'free', label: 'Libre' },
                  { value: 'owned', label: 'De Usuarios' },
                ]}
                placeholder="Todos"
              />
            </div>

            {/* Position Filter */}
            <div className="w-[48%] shrink-0 space-y-1.5 md:w-auto md:min-w-27.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                POSICIÓN
              </span>
              <CustomSelect
                value={filterPosition}
                onChange={setFilterPosition}
                options={[
                  { value: 'all', label: 'Todas' },
                  ...availablePositions.map((pos) => ({ value: pos, label: pos })),
                ]}
                placeholder="Todas"
              />
            </div>

            {/* Team Filter */}
            <div className="w-[48%] shrink-0 space-y-1.5 md:w-auto md:min-w-32.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                EQUIPO
              </span>
              <CustomSelect
                value={filterTeam}
                onChange={setFilterTeam}
                options={[
                  { value: 'all', label: 'Todos' },
                  ...availableTeams.map((team) => ({ value: team, label: team })),
                ]}
                placeholder="Todos"
              />
            </div>

            {/* Price Filter */}
            <div className="w-[48%] shrink-0 space-y-1.5 md:w-auto md:min-w-30">
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
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border/50 bg-secondary/50 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="shrink-0 space-y-1.5 self-end">
              <button
                onClick={handleResetFilters}
                className="h-10 px-2.5 flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all cursor-pointer font-bold text-[10px] uppercase tracking-wider"
                title="Limpiar Filtros"
              >
                <div className="flex items-center gap-1.5">
                  <span className="p-0.5 bg-red-500/20 rounded-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </span>
                  <span className="hidden min-[1600px]:inline">Limpiar</span>
                </div>
              </button>
            </div>
          </div>

          {/* Counter */}
          <div className="mt-2 flex h-10 items-center gap-1 self-start whitespace-nowrap rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm font-medium text-muted-foreground xl:mt-0 xl:min-w-fit xl:self-end">
            <span className="font-bold text-foreground">{filteredListings.length}</span>
            {filteredListings.length === 1 ? 'resultado' : 'resultados'}
          </div>
        </div>
      </ElegantCard>

      {/* Grid or Empty State */}
      <LayoutGroup>
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
            {filteredListings.map((player, index) => (
              <MarketPlayerCard
                key={`${player.player_id}-${player.seller_id}-${index}`}
                player={player}
                isExpanded={expandedPlayerId === player.player_id}
                onToggleExpand={() =>
                  setExpandedPlayerId(
                    expandedPlayerId === player.player_id ? null : player.player_id
                  )
                }
                onExpandLevel2={() => setSelectedPlayer(player)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-card/50 rounded-xl border border-border/50 backdrop-blur-sm text-center">
            <div className="bg-secondary/50 p-4 rounded-full mb-4">
              <Filter size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-foreground text-lg font-bold">No hay resultados</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm text-center">
              No se han encontrado jugadores que coincidan con los filtros aplicados en el mercado
              actual.
            </p>
            <button
              onClick={() => {
                setFilterOwner('all');
                setFilterPosition('all');
                setFilterTeam('all');
                setMaxPrice('');
                setSearchQuery('');
              }}
              className="mt-6 px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium rounded-lg transition-colors border border-border/50 cursor-pointer shadow-sm"
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}

        {/* Level 2 Organic Hero Expansion Modal */}
        <AnimatePresence>
          {selectedPlayer && (
            <ExpandedPlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
          )}
        </AnimatePresence>
      </LayoutGroup>
    </Section>
  );
}
