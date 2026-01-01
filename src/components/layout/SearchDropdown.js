'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, Users, Trophy, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * SearchDropdown - Global search with dropdown results
 * Updated: Consistent structure but with type-specific color coding
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

  // Build flat list for keyboard navigation
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

  const hasResults = allResults.length > 0;

  // Helper to get color styles based on result type
  const getTypeStyles = (type) => {
    switch (type) {
      case 'player':
        return {
          iconColor: 'text-blue-400',
          activeBg: 'bg-blue-500/10',
          activeText: 'text-blue-400',
        };
      case 'team':
        return {
          iconColor: 'text-amber-400',
          activeBg: 'bg-amber-500/10',
          activeText: 'text-amber-400',
        };
      case 'user':
        return {
          iconColor: 'text-emerald-400',
          activeBg: 'bg-emerald-500/10',
          activeText: 'text-emerald-400',
        };
      default:
        return {
          iconColor: 'text-muted-foreground',
          activeBg: 'bg-secondary',
          activeText: 'text-foreground',
        };
    }
  };

  const renderItem = (item, index, icon, subtitle, rightContent = null) => {
    const isActive = activeIndex === index;
    const Icon = icon;
    const styles = getTypeStyles(item.type);

    return (
      <button
        key={`${item.type}-${item.id || item.name}`}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setActiveIndex(index)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-sm transition-colors ${
          isActive
            ? `${styles.activeBg} ${styles.activeText}`
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${isActive ? 'text-current' : styles.iconColor}`} 
        />
        <div className="flex-1 flex flex-col items-start min-w-0">
          <span className={`font-medium truncate ${isActive ? 'text-current' : 'text-foreground'}`}>
            {item.name}
          </span>
          {subtitle && (
            <span className={`text-xs truncate font-normal ${isActive ? 'opacity-80' : 'text-muted-foreground'}`}>
              {subtitle}
            </span>
          )}
        </div>
        {rightContent && <div className="text-xs opacity-70 shrink-0">{rightContent}</div>}
      </button>
    );
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative group">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar..."
          className="w-full pl-10 pr-10 py-2 rounded-xl bg-secondary border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
          />
        )}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery('');
              setResults({ players: [], teams: [], users: [] });
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-xl shadow-black/20 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {!hasResults && !loading && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No se encontraron resultados para &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Players */}
          {results.players.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-blue-400/70 uppercase tracking-wider mb-1">
                Jugadores
              </div>
              {results.players.map((player, idx) => {
                const globalIdx = idx;
                return renderItem(
                  { type: 'player', ...player },
                  globalIdx,
                  User,
                  `${player.team} · ${player.position}`
                );
              })}
            </div>
          )}

          {/* Teams */}
          {results.teams.length > 0 && (
            <div className="p-2 border-t border-border/30">
              <div className="px-2 py-1.5 text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-1">
                Equipos
              </div>
              {results.teams.map((team, idx) => {
                const globalIdx = results.players.length + idx;
                return renderItem({ type: 'team', ...team }, globalIdx, Trophy, null);
              })}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div className="p-2 border-t border-border/30">
              <div className="px-2 py-1.5 text-xs font-semibold text-emerald-400/70 uppercase tracking-wider mb-1">
                Usuarios
              </div>
              {results.users.map((user, idx) => {
                const globalIdx = results.players.length + results.teams.length + idx;
                return renderItem({ type: 'user', ...user }, globalIdx, Users, null);
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}