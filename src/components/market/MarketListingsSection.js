import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Section } from '@/components/layout';
import MarketPlayerCard from './MarketPlayerCard';

export default function MarketListingsSection({ listings = [], onAnalyze }) {
  const [filterOwner, setFilterOwner] = useState('all'); // 'all', 'free', 'owned'
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <Section title="Jugadores en el Mercado" delay={50} background="section-base">
      {/* Filters Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex flex-col xl:flex-row gap-4 xl:items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Text Search */}
          <div className="relative flex items-center bg-zinc-800 rounded-lg border border-zinc-700 w-full sm:w-56 focus-within:border-blue-500 transition-colors">
            <div className="pl-3 py-2 text-zinc-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Buscar jugador..."
              className="bg-transparent text-sm text-white px-2 py-2 w-full focus:outline-none placeholder-zinc-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="pr-3 text-zinc-500 hover:text-zinc-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Owner Filter */}
          <select
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors hover:bg-zinc-750 cursor-pointer"
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
          >
            <option value="all">Propiedad (Todos)</option>
            <option value="free">Solo Mercado (Libre)</option>
            <option value="owned">De Usuarios</option>
          </select>

          {/* Position Filter */}
          <select
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors hover:bg-zinc-750 cursor-pointer"
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
          >
            <option value="all">Posición (Todas)</option>
            {availablePositions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors hover:bg-zinc-750 max-w-[160px] truncate cursor-pointer"
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          >
            <option value="all">Equipo (Todos)</option>
            {availableTeams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          {/* Price Filter */}
          <select
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors hover:bg-zinc-750 cursor-pointer"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          >
            <option value="">Precio Máx (Cualquiera)</option>
            <option value="1000000">&lt; 1.000.000 €</option>
            <option value="3000000">&lt; 3.000.000 €</option>
            <option value="5000000">&lt; 5.000.000 €</option>
            <option value="10000000">&lt; 10.000.000 €</option>
            <option value="15000000">&lt; 15.000.000 €</option>
          </select>
        </div>

        {/* Counter */}
        <div className="text-sm font-bold text-zinc-500 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 whitespace-nowrap self-start xl:self-auto">
          {filteredListings.length} {filteredListings.length === 1 ? 'resultado' : 'resultados'}
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((player, index) => (
            <MarketPlayerCard
              key={`${player.player_id}-${player.seller_id}-${index}`}
              player={player}
              onAnalyze={onAnalyze}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/40 rounded-2xl border border-zinc-800 border-dashed">
          <div className="bg-zinc-800/50 p-4 rounded-full mb-4">
            <Filter size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-zinc-200 text-lg font-bold">No hay resultados</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm text-center">
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
            className="mt-6 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold rounded-xl transition shadow-sm border border-zinc-700"
          >
            Limpiar todos los filtros
          </button>
        </div>
      )}
    </Section>
  );
}
