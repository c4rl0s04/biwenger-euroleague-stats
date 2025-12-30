'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, Users, Trophy, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * SearchDropdown - Global search with dropdown results
 * Searches players, teams, and users
 */
export default function SearchDropdown({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ players: [], teams: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ players: [], teams: [], users: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.data || { players: [], teams: [], users: [] });
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Global keyboard shortcut: Cmd+K or Ctrl+K to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build flat list of all results for keyboard navigation
  const allResults = [
    ...results.players.map((p) => ({ type: 'player', ...p })),
    ...results.teams.map((t) => ({ type: 'team', ...t })),
    ...results.users.map((u) => ({ type: 'user', ...u })),
  ];

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const item = allResults[activeIndex];
        handleSelect(item);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        onClose?.();
      }
    },
    [isOpen, activeIndex, allResults, onClose]
  );

  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery('');
    if (item.type === 'player') {
      router.push(`/player/${item.id}`);
    } else if (item.type === 'team') {
      router.push(`/team/${encodeURIComponent(item.name)}`);
    } else if (item.type === 'user') {
      router.push(`/user/${item.id}`);
    }
    onClose?.();
  };

  const formatPrice = (price) => {
    if (!price) return '';
    if (price >= 1000000) return `€${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `€${(price / 1000).toFixed(0)}K`;
    return `€${price}`;
  };

  const hasResults = allResults.length > 0;

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative group">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar jugadores, equipos, usuarios..."
          className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-900/50 border border-border/50 text-sm text-foreground placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 animate-spin"
          />
        )}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery('');
              setResults({ players: [], teams: [], users: [] });
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[hsl(220,20%,8%)] border border-border/50 rounded-xl shadow-xl shadow-black/20 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {!hasResults && !loading && (
            <div className="p-4 text-center text-slate-500 text-sm">
              No se encontraron resultados para &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Players */}
          {results.players.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/50">
                Jugadores
              </div>
              {results.players.map((player, idx) => {
                const globalIdx = idx;
                return (
                  <button
                    key={`player-${player.id}`}
                    onClick={() => handleSelect({ type: 'player', ...player })}
                    className={`group w-full px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 hover:border-l-2 hover:border-primary transition-all ${
                      activeIndex === globalIdx
                        ? 'bg-slate-800/50 border-l-2 border-primary'
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <User size={16} className="text-blue-400" />
                    <div className="flex-1 text-left">
                      <div
                        className={`text-sm transition-colors ${
                          activeIndex === globalIdx
                            ? 'text-primary'
                            : 'text-white group-hover:text-primary'
                        }`}
                      >
                        {player.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {player.position} · {player.team}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">{formatPrice(player.price)}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Teams */}
          {results.teams.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/50">
                Equipos
              </div>
              {results.teams.map((team, idx) => {
                const globalIdx = results.players.length + idx;
                return (
                  <button
                    key={`team-${team.name}`}
                    onClick={() => handleSelect({ type: 'team', ...team })}
                    className={`group w-full px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 hover:border-l-2 hover:border-primary transition-all ${
                      activeIndex === globalIdx
                        ? 'bg-slate-800/50 border-l-2 border-primary'
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <Trophy size={16} className="text-yellow-400" />
                    <div className="flex-1 text-left">
                      <div
                        className={`text-sm transition-colors ${
                          activeIndex === globalIdx
                            ? 'text-primary'
                            : 'text-white group-hover:text-primary'
                        }`}
                      >
                        {team.name}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">{team.player_count} jugadores</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/50">
                Usuarios
              </div>
              {results.users.map((user, idx) => {
                const globalIdx = results.players.length + results.teams.length + idx;
                return (
                  <button
                    key={`user-${user.id}`}
                    onClick={() => handleSelect({ type: 'user', ...user })}
                    className={`group w-full px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 hover:border-l-2 hover:border-primary transition-all ${
                      activeIndex === globalIdx
                        ? 'bg-slate-800/50 border-l-2 border-primary'
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <Users size={16} className="text-green-400" />
                    <div className="flex-1 text-left">
                      <div
                        className={`text-sm transition-colors ${
                          activeIndex === globalIdx
                            ? 'text-primary'
                            : 'text-white group-hover:text-primary'
                        }`}
                      >
                        {user.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
